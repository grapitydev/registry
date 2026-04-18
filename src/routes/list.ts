import { Hono } from "hono";
import type { ListSpecsResponse } from "@grapity/core";

export const listRoute = new Hono().get("/", async (c) => {
  return c.json<ListSpecsResponse>([]);
});