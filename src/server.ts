import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { prettyJSON } from "hono/pretty-json";
import type { SpecStore } from "@grapity/core";
import { pushRoute } from "./routes/push";
import { validateRoute } from "./routes/validate";
import { listRoute } from "./routes/list";
import { getSpecRoute } from "./routes/get-spec";
import { versionsRoute } from "./routes/versions";
import { getVersionRoute } from "./routes/get-version";
import { compatReportRoute } from "./routes/compat-report";
import { serveSpecRoute } from "./routes/serve-spec";
import { healthRoute } from "./routes/health";
import { welcomeRoute } from "./routes/welcome";
import type { ServerConfig } from "./config";

export type AppEnv = {
  Variables: {
    store: SpecStore;
    config: ServerConfig;
  };
};

export function createApp(config: ServerConfig, store: SpecStore) {
  const app = new Hono<AppEnv>();

  app.use("*", logger());
  app.use("*", cors());
  app.use("*", prettyJSON());

  app.use("*", async (c, next) => {
    c.set("store", store);
    c.set("config", config);
    await next();
  });

  app.route("/v1/specs", pushRoute);
  app.route("/v1/specs", validateRoute);
  app.route("/v1/specs", listRoute);
  app.route("/v1/specs", getSpecRoute);
  app.route("/v1/specs", versionsRoute);
  app.route("/v1/specs", getVersionRoute);
  app.route("/v1/specs", serveSpecRoute);
  app.route("/v1/specs", compatReportRoute);
  app.route("/v1/health", healthRoute);
  app.route("/", welcomeRoute);

  return app;
}

export { Hono };
export type { ServerConfig } from "./config";
