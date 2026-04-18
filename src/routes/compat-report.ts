import { Hono } from "hono";
import type { GetCompatReportResponse } from "@grapity/core";

export const compatReportRoute = new Hono().get(
  "/:name/compat/:semver",
  async (c) => {
    const name = c.req.param("name");
    const semver = c.req.param("semver");

    return c.json<GetCompatReportResponse>({
      compatReport: {
        previousVersion: "0.0.0",
        classification: "patch",
        breakingChanges: [],
        safeChanges: [],
      },
    });
  }
);