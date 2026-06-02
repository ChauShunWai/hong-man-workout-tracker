import assert from "node:assert";
import { neon } from "@neondatabase/serverless";
import "dotenv/config";
import { drizzle } from "drizzle-orm/neon-http";

assert(process.env.DATABASE_URL, "Missing DATABASE_URL env");

const sql = neon(process.env.DATABASE_URL);
const db = drizzle({ client: sql });

export default db;
