import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { prettyJSON } from "hono/pretty-json";
import { pushRoute } from "./routes/push";
import { validateRoute } from "./routes/validate";
import { listRoute } from "./routes/list";
import { getSpecRoute } from "./routes/get-spec";
import { versionsRoute } from "./routes/versions";
import { getVersionRoute } from "./routes/get-version";
import { compatReportRoute } from "./routes/compat-report";
import { deprecateRoute } from "./routes/deprecate";
import { healthRoute } from "./routes/health";
import type { ServerConfig } from "./config";

export function createApp(config: ServerConfig) {
  const app = new Hono();

  app.use("*", logger());
  app.use("*", cors());
  app.use("*", prettyJSON());

  app.route("/v1/specs", pushRoute);
  app.route("/v1/specs", validateRoute);
  app.route("/v1/specs", listRoute);
  app.route("/v1/specs", getSpecRoute);
  app.route("/v1/specs", versionsRoute);
  app.route("/v1/specs", getVersionRoute);
  app.route("/v1/specs", compatReportRoute);
  app.route("/v1/specs", deprecateRoute);
  app.route("/v1/health", healthRoute);

  return app;
}

export { Hono };
export type { ServerConfig } from "./config";