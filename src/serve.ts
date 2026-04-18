import { execSync } from "node:child_process";
import { serve } from "@hono/node-server";
import { createApp } from "./server";
import type { ServerConfig } from "./config";
import { defaultConfig } from "./config";
import { SQLiteSpecStore } from "./storage/sqlite";
import { initializeDatabase } from "./storage/migrate";

function checkOasdiff(): void {
  try {
    execSync("which oasdiff", { stdio: "pipe" });
  } catch {
    console.error(
      "Error: oasdiff is required but not found on PATH.\n\n" +
      "Install with:\n" +
      "  brew install tufin/tufin/oasdiff\n\n" +
      "Or download from: https://github.com/Tufin/oasdiff/releases\n\n" +
      "After installing, run: grapity serve"
    );
    process.exit(1);
  }
}

export async function startServer(userConfig?: Partial<ServerConfig>) {
  const config: ServerConfig = { ...defaultConfig, ...userConfig };

  checkOasdiff();

  if (!config.sqlitePath) {
    const homeDir = process.env.HOME || process.env.USERPROFILE || ".";
    config.sqlitePath = `${homeDir}/.grapity/registry.db`;
  }

  if (config.database === "sqlite" && config.auth?.mode && config.auth.mode !== "none") {
    console.warn("Warning: Auth is enabled in local SQLite mode. This is intended for shared local registries.");
  }

  const store = new SQLiteSpecStore(config.sqlitePath);
  await initializeDatabase(store);

  const app = createApp(config);

  console.log(`Starting Grapity Registry on port ${config.port}`);
  console.log(`Database: ${config.database} (${config.sqlitePath || config.postgresUrl})`);

  serve({
    fetch: app.fetch,
    port: config.port,
  });

  console.log(`Grapity Registry listening on http://localhost:${config.port}`);

  return app;
}

export type { ServerConfig };