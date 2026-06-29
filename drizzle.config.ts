import assert from "node:assert";
import "dotenv/config";
import { defineConfig } from "drizzle-kit";

assert(process.env.DATABASE_URL, "Missing DATABASE_URL env");

export default defineConfig({
  schema: "./src/db/schema",
  out: "./migrations",
  dialect: "postgresql",
  schemaFilter: ["public", "neon_auth"],
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
