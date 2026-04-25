import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/serve.ts"],
  format: ["esm"],
  outExtension: () => ({ js: ".js" }),
  dts: true,
  clean: true,
  splitting: false,
  external: ["pg"],
});