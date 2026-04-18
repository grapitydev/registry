import { Hono } from "hono";
import type { AppEnv } from "../server";
import { RegistryService } from "../services/registry";

export const getVersionRoute = new Hono<AppEnv>().get(
  "/:name/versions/:semver",
  async (c) => {
    const name = c.req.param("name");
    const semver = c.req.param("semver");
    const store = c.get("store");
    const service = new RegistryService(store);

    const version = await service.getVersion(name, semver);
    if (!version) {
      return c.json({ error: "not_found", message: `Version ${semver} not found for spec "${name}"`, statusCode: 404 }, 404);
    }

    return c.json({ version });
  }
);