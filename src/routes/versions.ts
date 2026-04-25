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

    const versions = await service.listVersions(name);
    return c.json(versions.map(withoutContent));
  }
);