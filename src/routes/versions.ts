import { Hono } from "hono";
import type { AppEnv } from "../server";
import { RegistryService } from "../services/registry";
import type { SpecVersion } from "@grapity/core";

function withoutContent({ content: _, ...rest }: SpecVersion) {
  return rest;
}

export const versionsRoute = new Hono<AppEnv>().get(
  "/:name/versions",
  async (c) => {
    const name = c.req.param("name");
    const store = c.get("store");
    const service = new RegistryService(store);

    const rawLimit = parseInt(c.req.query("limit") ?? "10", 10);
    const rawOffset = parseInt(c.req.query("offset") ?? "0", 10);
    const limit = Math.min(Math.max(isNaN(rawLimit) ? 10 : rawLimit, 1), 25);
    const offset = Math.max(isNaN(rawOffset) ? 0 : rawOffset, 0);

    const { versions, total } = await service.listVersions(name, { limit, offset });
    return c.json({
      data: versions.map(withoutContent),
      pagination: {
        hasMore: offset + limit < total,
        limit,
        offset,
        total,
      },
    });
  }
);
