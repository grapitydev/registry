import { Hono } from "hono";
import type { ListVersionsResponse } from "@grapity/core";

export const versionsRoute = new Hono().get(
  "/:name/versions",
  async (c) => {
    return c.json<ListVersionsResponse>([]);
  }
);