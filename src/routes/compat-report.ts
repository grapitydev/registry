import { Hono } from "hono";
import type { AppEnv } from "../server";
import { RegistryService } from "../services/registry";

export const compatReportRoute = new Hono<AppEnv>().get(
  "/:name/compat/:semver",
  async (c) => {
    const name = c.req.param("name");
    const semver = c.req.param("semver");
    const store = c.get("store");
    const service = new RegistryService(store);

    const report = await service.getCompatReport(name, semver);
    if (!report) {
      return c.json({ error: "not_found", message: `Compat report not found for ${name}@${semver}`, statusCode: 404 }, 404);
    }

    return c.json({ compatReport: report });
  }
);