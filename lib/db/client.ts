import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { resolvePostgresUrl } from "./postgres-url";

const globalForPostgres = globalThis as unknown as {
  postgresClient?: ReturnType<typeof postgres>;
};

export function getPostgresClient() {
  if (!globalForPostgres.postgresClient) {
    const url = resolvePostgresUrl();
    if (!url) {
      throw new Error(
        "POSTGRES_URL is required for database-backed routes. Set it in Vercel for Production and Preview environments."
      );
    }

    globalForPostgres.postgresClient = postgres(url, {
      prepare: false,
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
    });
  }

  return globalForPostgres.postgresClient;
}

const createDb = () => drizzle(getPostgresClient());

type Database = ReturnType<typeof createDb>;

let dbInstance: Database | undefined;

function getDb() {
  dbInstance ??= createDb();
  return dbInstance;
}

export const db = new Proxy({} as Database, {
  get(_target, prop, receiver) {
    const value = Reflect.get(getDb(), prop, receiver);
    return typeof value === "function" ? value.bind(getDb()) : value;
  },
});
