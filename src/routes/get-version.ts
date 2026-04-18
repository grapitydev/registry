import { Hono } from "hono";
import type { GetVersionResponse } from "@grapity/core";

export const getVersionRoute = new Hono().get(
  "/:name/versions/:semver",
  async (c) => {
    const name = c.req.param("name");
    const semver = c.req.param("semver");

    return c.json<GetVersionResponse>({
      version: {
        id: "",
        specId: "",
        semver,
        content: "",
        checksum: "",
        status: "active",
        createdAt: new Date(),
      },
    });
  }
);