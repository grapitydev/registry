import { Hono } from "hono";
import type { DeprecateVersionRequest, DeprecateVersionResponse } from "@grapity/core";

export const deprecateRoute = new Hono().patch(
  "/:name/versions/:semver/deprecate",
  async (c) => {
    const name = c.req.param("name");
    const semver = c.req.param("semver");
    const body = await c.req.json<DeprecateVersionRequest>();

    return c.json<DeprecateVersionResponse>({
      version: {
        id: "",
        specId: "",
        semver,
        content: "",
        checksum: "",
        status: "deprecated",
        sunsetDate: body.sunsetDate ? new Date(body.sunsetDate) : undefined,
        createdAt: new Date(),
      },
    });
  }
);