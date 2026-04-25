import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/storage/schema.ts",
  out: "./drizzle/migrations/sqlite",
  dialect: "sqlite",
});
