import { Hono } from "hono";
import yaml from "js-yaml";
import type { AppEnv } from "../server";
import { RegistryService } from "../services/registry";

const CONTENT_TYPES: Record<string, Record<string, string>> = {
  openapi: {
    json: "application/vnd.oai.openapi+json",
    yaml: "application/vnd.oai.openapi+yaml",
  },
  asyncapi: {
    json: "application/vnd.aai.asyncapi+json",
    yaml: "application/vnd.aai.asyncapi+yaml",
  },
};

async function serveSpec(
  c: any,
  name: string,
  semver: string | undefined,
  format: "json" | "yaml",
) {
  const store = c.get("store");
  const service = new RegistryService(store);

  let content: string;
  let specType: string;
  let resolvedSemver: string | undefined;

  if (semver) {
    const version = await service.getVersion(name, semver);
    if (!version) {
      return c.json({ error: "not_found", message: `Version ${semver} not found for spec "${name}"`, statusCode: 404 }, 404);
    }
    content = version.content;
    resolvedSemver = semver;
    const result = await service.getSpec(name);
    specType = result?.spec.type ?? "openapi";
  } else {
    const result = await service.getSpec(name);
    if (!result || !result.latestVersion) {
      return c.json({ error: "not_found", message: `Spec "${name}" not found`, statusCode: 404 }, 404);
    }
    content = result.latestVersion.content;
    resolvedSemver = result.latestVersion.semver;
    specType = result.spec.type;
  }

  const parsed = yaml.load(content);
  const contentType = CONTENT_TYPES[specType]?.[format] ?? CONTENT_TYPES.openapi[format];
  const headers: Record<string, string> = {
    "Content-Type": contentType,
  };
  if (resolvedSemver) {
    headers["Grapity-Resolved-Version"] = resolvedSemver;
  }

  if (format === "yaml") {
    return new Response(yaml.dump(parsed), { headers });
  }

  return new Response(JSON.stringify(parsed), { headers });
}

export const serveSpecRoute = new Hono<AppEnv>()
  .get("/:name/spec.json", (c) =>
    serveSpec(c, c.req.param("name"), undefined, "json"),
  )
  .get("/:name/spec.yaml", (c) =>
    serveSpec(c, c.req.param("name"), undefined, "yaml"),
  )
  .get("/:name/versions/:semver/spec.json", (c) =>
    serveSpec(c, c.req.param("name"), c.req.param("semver"), "json"),
  )
  .get("/:name/versions/:semver/spec.yaml", (c) =>
    serveSpec(c, c.req.param("name"), c.req.param("semver"), "yaml"),
  );
