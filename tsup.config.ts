import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/serve.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  splitting: false,
  external: ["better-sqlite3", "pg"],
});