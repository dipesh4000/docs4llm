import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { isProductionEnvironment } from "@/lib/constants";
import { ChatbotError } from "@/lib/errors";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const MAX_MESSAGES = 10;
const TTL_SECONDS = 60 * 60;

let rateLimitSql: ReturnType<typeof postgres> | null = null;

function getRateLimitDb() {
  if (!process.env.POSTGRES_URL) {
    return null;
  }
  if (!rateLimitSql) {
    rateLimitSql = postgres(process.env.POSTGRES_URL, { max: 1 });
  }
  return drizzle(rateLimitSql);
}

async function ensureRateLimitTable() {
  if (!process.env.POSTGRES_URL) {
    return;
  }
  const client = postgres(process.env.POSTGRES_URL, { max: 1 });
  await client`
    CREATE TABLE IF NOT EXISTS "IpRateLimit" (
      "key" varchar(128) PRIMARY KEY NOT NULL,
      "count" integer NOT NULL DEFAULT 0,
      "expiresAt" timestamp NOT NULL
    )
  `;
  await client.end();
}

export async function checkIpRateLimit(ip: string | undefined) {
  if (!isProductionEnvironment || !ip) {
    return;
  }

  if (!isSupabaseConfigured() && !process.env.POSTGRES_URL) {
    return;
  }

  try {
    await ensureRateLimitTable();
    const db = getRateLimitDb();
    if (!db) {
      return;
    }

    const key = `ip-rate-limit:${ip}`;
    const expiresAt = new Date(Date.now() + TTL_SECONDS * 1000);

    const result = await db.execute<{ count: number }>(sql`
      INSERT INTO "IpRateLimit" ("key", "count", "expiresAt")
      VALUES (${key}, 1, ${expiresAt})
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE
          WHEN "IpRateLimit"."expiresAt" < NOW() THEN 1
          ELSE "IpRateLimit"."count" + 1
        END,
        "expiresAt" = CASE
          WHEN "IpRateLimit"."expiresAt" < NOW() THEN ${expiresAt}
          ELSE "IpRateLimit"."expiresAt"
        END
      RETURNING "count"
    `);

    const count = Number(result.at(0)?.count ?? 0);
    if (count > MAX_MESSAGES) {
      throw new ChatbotError("rate_limit:chat");
    }
  } catch (error) {
    if (error instanceof ChatbotError) {
      throw error;
    }
  }
}
