import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/storage/schema-pg.ts",
  out: "./drizzle/migrations/pg",
  dialect: "postgresql",
});
