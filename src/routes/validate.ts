import { Hono } from "hono";
import type { AppEnv } from "../server";

export const validateRoute = new Hono<AppEnv>().post(
  "/:name/validate",
  async (c) => {
    const name = c.req.param("name");
    const body = await c.req.json<{ content: string; name: string }>();

    return c.json({
      valid: true,
    });
  }
);