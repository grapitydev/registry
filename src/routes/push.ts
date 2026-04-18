import { Hono } from "hono";
import type { PushSpecRequest, PushSpecResponse } from "@grapity/core";

export const pushRoute = new Hono().post("/", async (c) => {
  const body = await c.req.json<PushSpecRequest>();

  return c.json<PushSpecResponse>(
    {
      spec: {
        id: "",
        name: body.name,
        type: body.type ?? "openapi",
        description: body.description,
        owner: body.owner,
        sourceRepo: body.sourceRepo,
        tags: body.tags ?? [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      version: {
        id: "",
        specId: "",
        semver: "0.0.0",
        content: body.content,
        checksum: "",
        status: "active",
        createdAt: new Date(),
      },
      isNewSpec: true,
    },
    201
  );
});