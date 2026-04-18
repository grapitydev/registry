import { Hono } from "hono";
import type { AppEnv } from "../server";

export const healthRoute = new Hono<AppEnv>().get("/", async (c) => {
  return c.json({
    status: "ok",
    version: "0.0.1",
    uptime: process.uptime(),
  });
});