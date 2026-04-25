import { Hono } from "hono";
import type { AppEnv } from "../server";
import { RegistryService } from "../services/registry";
import type { SpecVersion } from "@grapity/core";

function withoutContent({ content: _, ...rest }: SpecVersion) {
  return rest;
}

export const getSpecRoute = new Hono<AppEnv>().get("/:name", async (c) => {
  const name = c.req.param("name");
  const store = c.get("store");
  const service = new RegistryService(store);

  const result = await service.getSpec(name);
  if (!result) {
    return c.json({ error: "not_found", message: `Spec "${name}" not found`, statusCode: 404 }, 404);
  }

  const { spec, latestVersion } = result;
  return c.json({
    spec,
    latestVersion: latestVersion ? withoutContent(latestVersion) : undefined,
  });
});