import { Hono } from "hono";
import type { GetSpecResponse } from "@grapity/core";

export const getSpecRoute = new Hono().get("/:name", async (c) => {
  const name = c.req.param("name");

  return c.json<GetSpecResponse>({
    spec: {
      id: "",
      name,
      type: "openapi",
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
});