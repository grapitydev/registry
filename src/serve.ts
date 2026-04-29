import path from "node:path";
import fs from "node:fs";
import { serve } from "@hono/node-server";
import { createApp } from "./server";
import type { ServerConfig } from "./config";
import { defaultConfig } from "./config";
import { SQLiteSpecStore } from "./storage/sqlite";

export async function startServer(userConfig?: Partial<ServerConfig>) {
  const config: ServerConfig = { ...defaultConfig, ...userConfig };

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

  const store = new SQLiteSpecStore(config.sqlitePath!);
  await store.migrate();

  const app = createApp(config, store);

  serve({
    fetch: app.fetch,
    port: config.port,
  });

  return app;
}

export type { ServerConfig };

if (process.argv[1] === new URL(import.meta.url).pathname) {
  startServer();
}
