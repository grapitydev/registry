import { Hono } from "hono";
import type { HealthResponse } from "@grapity/core";

export const healthRoute = new Hono().get("/", async (c) => {
  return c.json<HealthResponse>({
    status: "ok",
    version: "0.0.1",
    uptime: process.uptime(),
  });
});