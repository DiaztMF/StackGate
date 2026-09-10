import { config } from "dotenv";
import { attachDatabasePool } from "@vercel/functions";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema.js";

config();

type StackGateDatabase = NodePgDatabase<typeof schema>;

let cachedPool: Pool | undefined;
let cachedDb: StackGateDatabase | undefined;

function connectionString(): string {
  const value = process.env.DATABASE_URL ?? process.env.TEST_DATABASE_URL;
  if (!value) throw new Error("DATABASE_URL or TEST_DATABASE_URL must be set");
  return value;
}

export function getPool(): Pool {
  if (!cachedPool) {
    cachedPool = new Pool({ connectionString: connectionString(), max: 5 });
    attachDatabasePool(cachedPool);
  }
  return cachedPool;
}

export function getDb(): StackGateDatabase {
  if (!cachedDb) cachedDb = drizzle(getPool(), { schema });
  return cachedDb;
}

function forward(property: PropertyKey): unknown {
  const database = getDb() as unknown as Record<PropertyKey, unknown>;
  const value = database[property];
  if (typeof value === "function") return value.bind(getDb());
  return value;
}

// Lazily initialized: importing this module must never throw, so routes
// without DB access (e.g. /api/health) stay alive when env is missing.
// First DB access throws the missing-connection error instead.
export const db: StackGateDatabase = new Proxy({} as StackGateDatabase, {
  get: (_target, property) => forward(property),
});
