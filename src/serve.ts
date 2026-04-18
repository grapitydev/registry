import { execSync } from "node:child_process";
import path from "node:path";
import fs from "node:fs";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { serve } from "@hono/node-server";
import { createApp } from "./server";
import type { ServerConfig } from "./config";
import { defaultConfig } from "./config";
import { SQLiteSpecStore } from "./storage/sqlite";
import { runMigrations } from "./storage/migrate";

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

  if (!config.sqlitePath && config.database === "sqlite") {
    const homeDir = process.env.HOME || process.env.USERPROFILE || ".";
    config.sqlitePath = path.join(homeDir, ".grapity", "registry.db");
  }

  if (config.database === "sqlite" && config.sqlitePath) {
    const dir = path.dirname(config.sqlitePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  if (config.database === "sqlite" && config.auth?.mode && config.auth.mode !== "none") {
    console.warn("Warning: Auth is enabled in local SQLite mode. This is intended for shared local registries.");
  }

  const store = new SQLiteSpecStore(config.sqlitePath!);

  const sqlite = new Database(config.sqlitePath);
  const db = drizzle(sqlite);
  await runMigrations(db);

  const app = createApp(config, store);

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