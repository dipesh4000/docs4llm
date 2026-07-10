import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

config({
  path: ".env.local",
});

const PLACEHOLDER_PATTERN = /^\*{2,}$|\[YOUR-|\[PASSWORD\]|REPLACE_WITH/i;

function validatePostgresUrl(url: string): void {
  if (PLACEHOLDER_PATTERN.test(url)) {
    throw new Error(
      "POSTGRES_URL is still a placeholder. Set your Supabase database password:\n" +
        "  Dashboard → Project Settings → Database → Connection string → URI (Session pooler, port 6543)\n" +
        "  https://supabase.com/dashboard/project/ilibxowyivxhdujeguaw/settings/database"
    );
  }
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "postgresql:" && parsed.protocol !== "postgres:") {
      throw new Error("POSTGRES_URL must start with postgresql://");
    }
    if (!parsed.password || parsed.password.length < 4) {
      throw new Error(
        "POSTGRES_URL is missing the database password. Use the password from Supabase Database settings."
      );
    }
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        `POSTGRES_URL is not a valid connection string: ${url.slice(0, 40)}...\n` +
          "Use the Session pooler URI from Supabase (port 6543), e.g.:\n" +
          "postgresql://postgres.ilibxowyivxhdujeguaw:YOUR_PASSWORD@aws-1-ap-south-1.pooler.supabase.com:6543/postgres"
      );
    }
    throw error;
  }
}

const runMigrate = async () => {
  if (process.env.SKIP_MIGRATE === "1") {
    console.log("SKIP_MIGRATE set, skipping migrations");
    process.exit(0);
  }

  // Vercel build network cannot reach Supabase direct connections (IPv6 :5432).
  // Tables are applied via Supabase dashboard / `pnpm db:migrate` locally instead.
  if (process.env.VERCEL === "1") {
    console.log("Vercel build detected, skipping migrations");
    process.exit(0);
  }

  const postgresUrl = process.env.POSTGRES_URL;
  if (!postgresUrl) {
    console.log("POSTGRES_URL not defined, skipping migrations");
    process.exit(0);
  }

  validatePostgresUrl(postgresUrl);

  const connection = postgres(postgresUrl, { max: 1, prepare: false });
  const db = drizzle(connection);

  console.log("Running migrations...");

  const start = Date.now();
  await connection`SET statement_timeout = 0`;
  await migrate(db, { migrationsFolder: "./lib/db/migrations" });
  const end = Date.now();

  console.log("Migrations completed in", end - start, "ms");
  process.exit(0);
};

runMigrate().catch((err) => {
  console.error("Migration failed");
  console.error(err);
  process.exit(1);
});
