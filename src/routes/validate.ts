import { Hono } from "hono";
import type { AppEnv } from "../server";
import { validateOpenApiSpec } from "../parser/openapi/validate";
import { parseOpenApiSpec } from "../parser/openapi/parse";
import { diffSpecs } from "../compat-engine/differ";
import { checkGracePeriod } from "../compat-engine/grace-period";
import { classifyChanges } from "../compat-engine/classify";
import { RegistryService } from "../services/registry";
import type { components } from "../generated/api";

type ValidateBody = Partial<components["schemas"]["ValidateSpecRequest"]>;

export const validateRoute = new Hono<AppEnv>().post("/:name/validate", async (c) => {
  const name = c.req.param("name");

  let body: ValidateBody;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "bad_request", message: "Request body must be valid JSON", statusCode: 400 }, 400);
  }

  if (!body.content || typeof body.content !== "string") {
    return c.json({ error: "bad_request", message: "Missing required field: content", statusCode: 400 }, 400);
  }

  const { valid, errors, warnings } = await validateOpenApiSpec(body.content);

  if (!valid) {
    return c.json({ data: { valid, errors, warnings } });
  }

  const store = c.get("store");
  const service = new RegistryService(store);
  const result = await service.getSpec(name);

  if (!result?.latestVersion) {
    return c.json({ data: { valid: true, errors: [], warnings: [] } });
  }

  try {
    const oldSpec = parseOpenApiSpec(result.latestVersion.content);
    const newSpec = parseOpenApiSpec(body.content);
    const changes = diffSpecs(oldSpec, newSpec);
    const graceViolations = checkGracePeriod(changes);
    const { compatReport } = classifyChanges(changes, graceViolations, result.latestVersion.semver);

    const hasBreaking = compatReport.breakingChanges.length > 0;
    return c.json({
      data: {
        compatReport,
        errors: hasBreaking ? compatReport.breakingChanges.map((b) => b.description) : [],
        valid: !hasBreaking,
        warnings,
      },
    });
  } catch (err) {
    return c.json({
      data: {
        errors: [err instanceof Error ? err.message : "Compat analysis failed"],
        valid: false,
        warnings,
      },
    });
  }
});
