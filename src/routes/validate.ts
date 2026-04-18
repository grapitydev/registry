import { Hono } from "hono";
import type { ValidateSpecRequest, ValidateSpecResponse } from "@grapity/core";

export const validateRoute = new Hono().post(
  "/:name/validate",
  async (c) => {
    const body = await c.req.json<ValidateSpecRequest>();
    const name = c.req.param("name");

    return c.json<ValidateSpecResponse>({
      valid: true,
      compatReport: undefined,
    });
  }
);