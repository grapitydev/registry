import { Hono } from "hono";
import type { AppEnv } from "../server";
import { RegistryService, BreakingChangeError, PrereleaseConstraintError } from "../services/registry";
import type { components } from "../generated/api";

type PushBody = Partial<components["schemas"]["PushSpecRequest"]>;

export const pushRoute = new Hono<AppEnv>().post("/", async (c) => {
  let body: PushBody;

  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "bad_request", message: "Request body must be valid JSON", statusCode: 400 }, 400);
  }

  if (!body.content || typeof body.content !== "string") {
    return c.json({ error: "bad_request", message: "Missing required field: content", statusCode: 400 }, 400);
  }
  if (!body.name || typeof body.name !== "string") {
    return c.json({ error: "bad_request", message: "Missing required field: name", statusCode: 400 }, 400);
  }

  if (body.force && !body.reason) {
    return c.json({
      error: "bad_request",
      message: "reason is required when force is true",
      statusCode: 400,
    }, 400);
  }

  const store = c.get("store");
  const service = new RegistryService(store);

  try {
    const result = await service.pushSpec(body.content, body.name, {
      type: body.type as "openapi" | "asyncapi" | undefined,
      description: body.description as string | undefined,
      owner: body.owner as string | undefined,
      sourceRepo: body.sourceRepo as string | undefined,
      tags: Array.isArray(body.tags) ? body.tags as string[] : undefined,
      gitRef: body.gitRef as string | undefined,
      pushedBy: body.pushedBy as string | undefined,
      version: body.version as string | undefined,
      prerelease: body.prerelease as boolean | undefined,
      force: body.force as boolean | undefined,
      reason: body.reason as string | undefined,
    });
    return c.json({ data: result }, 201);
  } catch (err) {
    if (err instanceof BreakingChangeError) {
      return c.json({
        error: "breaking_change",
        message: "Breaking changes detected. Use force: true with a reason to override, or declare an explicit major version.",
        statusCode: 409,
        compatReport: err.compatReport,
      }, 409);
    }
    if (err instanceof PrereleaseConstraintError) {
      return c.json({
        error: "prerelease_constraint",
        message: err.message,
        statusCode: 422,
      }, 422);
    }
    console.error("Push spec error:", err);
    return c.json({
      error: "internal_error",
      message: err instanceof Error ? err.message : "An unexpected error occurred",
      statusCode: 500,
    }, 500);
  }
});
