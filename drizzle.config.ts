import "dotenv/config";
import assert from "node:assert";
import { defineConfig } from "drizzle-kit";

assert(process.env.DATABASE_URL, "Missing DATABASE_URL env");

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
