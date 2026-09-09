import { config } from "dotenv";
import { attachDatabasePool } from "@vercel/functions";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema.js";

config();

const connectionString = process.env.DATABASE_URL ?? process.env.TEST_DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL or TEST_DATABASE_URL must be set");

export const pool = new Pool({ connectionString, max: 5 });
attachDatabasePool(pool);
export const db = drizzle(pool, { schema });
