import { Hono } from "hono";
import type { AppEnv } from "../server";
import { RegistryService } from "../services/registry";

export const pushRoute = new Hono<AppEnv>().post("/", async (c) => {
  const body = await c.req.json<{
    content: string;
    name: string;
    type?: "openapi" | "asyncapi";
    description?: string;
    owner?: string;
    sourceRepo?: string;
    tags?: string[];
    gitRef?: string;
    pushedBy?: string;
    prerelease?: boolean;
    force?: boolean;
    reason?: string;
  }>();

  const store = c.get("store");
  const service = new RegistryService(store);

  const result = await service.pushSpec(body.content, body.name, {
    type: body.type,
    description: body.description,
    owner: body.owner,
    sourceRepo: body.sourceRepo,
    tags: body.tags,
    gitRef: body.gitRef,
    pushedBy: body.pushedBy,
    prerelease: body.prerelease,
    force: body.force,
    reason: body.reason,
  });

  return c.json(result, 201);
});