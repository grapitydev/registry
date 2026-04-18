import { Hono } from "hono";
import type { AppEnv } from "../server";
import { RegistryService } from "../services/registry";

export const deprecateRoute = new Hono<AppEnv>().patch(
  "/:name/versions/:semver/deprecate",
  async (c) => {
    const name = c.req.param("name");
    const semver = c.req.param("semver");
    const body = await c.req.json<{ sunsetDate: string }>();

    const store = c.get("store");
    const service = new RegistryService(store);

    try {
      const version = await service.deprecateVersion(
        name,
        semver,
        new Date(body.sunsetDate)
      );
      return c.json({ version });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return c.json({ error: "not_found", message, statusCode: 404 }, 404);
    }
  }
);