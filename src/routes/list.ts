import { Hono } from "hono";
import type { AppEnv } from "../server";
import { RegistryService } from "../services/registry";

export const listRoute = new Hono<AppEnv>().get("/", async (c) => {
  const store = c.get("store");
  const service = new RegistryService(store);

  const type = c.req.query("type") as "openapi" | "asyncapi" | undefined;
  const owner = c.req.query("owner");
  const tags = c.req.query("tags")?.split(",");

  const specs = await service.listSpecs({ type, owner, tags });
  return c.json({ data: specs });
});