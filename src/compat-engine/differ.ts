interface ParsedSpec {
  paths?: Record<string, Record<string, any>>;
}

const HTTP_METHODS = ["get", "post", "put", "delete", "patch", "head", "options", "trace"] as const;

export type RawChange =
  | { type: "endpoint-removed"; path: string; method: string; wasDeprecated: boolean; xSunset?: string; wasDraft?: boolean }
  | { type: "endpoint-added"; path: string; method: string }
  | { type: "endpoint-deprecated"; path: string; method: string; xSunset?: string }
  | { type: "stable-endpoint-marked-draft"; path: string; method: string }
  | { type: "required-param-added"; path: string; method: string; paramName: string; paramIn: string; wasDraft?: boolean }
  | { type: "optional-param-added"; path: string; method: string; paramName: string; paramIn: string }
  | { type: "response-property-removed"; path: string; method: string; statusCode: string; propertyPath: string; originalValue?: string; wasDraft?: boolean }
  | { type: "response-status-removed"; path: string; method: string; statusCode: string; wasDraft?: boolean }
  | { type: "response-status-added"; path: string; method: string; statusCode: string };

export function diffSpecs(oldSpec: ParsedSpec, newSpec: ParsedSpec): RawChange[] {
  const changes: RawChange[] = [];
  const oldPaths: Record<string, any> = oldSpec.paths ?? {};
  const newPaths: Record<string, any> = newSpec.paths ?? {};

  for (const path of Object.keys(oldPaths)) {
    const oldPathItem: Record<string, any> = oldPaths[path] ?? {};
    const newPathItem: Record<string, any> = newPaths[path] ?? {};

    for (const method of HTTP_METHODS) {
      const oldOp = oldPathItem[method];
      const newOp = newPathItem[method];

      if (oldOp && !newOp) {
        changes.push({
          type: "endpoint-removed",
          path,
          method,
          wasDeprecated: !!oldOp.deprecated,
          xSunset: typeof oldOp["x-sunset"] === "string" ? oldOp["x-sunset"] : undefined,
          wasDraft: !!oldOp["x-draft"],
        });
      } else if (oldOp && newOp) {
        if (!oldOp["x-draft"] && newOp["x-draft"]) {
          changes.push({ type: "stable-endpoint-marked-draft", path, method });
        }
        if (!oldOp.deprecated && newOp.deprecated) {
          changes.push({
            type: "endpoint-deprecated",
            path,
            method,
            xSunset: typeof newOp["x-sunset"] === "string" ? newOp["x-sunset"] : undefined,
          });
        }
        changes.push(...diffOperation(path, method, oldOp, newOp));
      }
    }
  }

  for (const path of Object.keys(newPaths)) {
    const oldPathItem: Record<string, any> = oldPaths[path] ?? {};
    const newPathItem: Record<string, any> = newPaths[path] ?? {};

    for (const method of HTTP_METHODS) {
      if (!oldPathItem[method] && newPathItem[method]) {
        changes.push({ type: "endpoint-added", path, method });
      }
    }
  }

  return changes;
}

function diffOperation(path: string, method: string, oldOp: any, newOp: any): RawChange[] {
  const changes: RawChange[] = [];
  const wasDraft = !!oldOp["x-draft"];

  const oldParamMap = new Map<string, any>();
  for (const p of (oldOp.parameters ?? [])) {
    oldParamMap.set(`${p.name}:${p.in}`, p);
  }
  for (const p of (newOp.parameters ?? [])) {
    const key = `${p.name}:${p.in}`;
    if (!oldParamMap.has(key)) {
      if (p.required) {
        changes.push({ type: "required-param-added", path, method, paramName: p.name, paramIn: p.in, wasDraft });
      } else {
        changes.push({ type: "optional-param-added", path, method, paramName: p.name, paramIn: p.in });
      }
    }
  }

  const oldResponses: Record<string, any> = oldOp.responses ?? {};
  const newResponses: Record<string, any> = newOp.responses ?? {};

  for (const status of Object.keys(oldResponses)) {
    if (!newResponses[status]) {
      changes.push({ type: "response-status-removed", path, method, statusCode: status, wasDraft });
    } else {
      changes.push(...diffResponseSchemas(path, method, status, oldResponses[status], newResponses[status], wasDraft));
    }
  }

  for (const status of Object.keys(newResponses)) {
    if (!oldResponses[status]) {
      changes.push({ type: "response-status-added", path, method, statusCode: status });
    }
  }

  return changes;
}

function diffResponseSchemas(path: string, method: string, statusCode: string, oldResp: any, newResp: any, wasDraft: boolean): RawChange[] {
  const changes: RawChange[] = [];
  const oldSchema = extractResponseSchema(oldResp);
  const newSchema = extractResponseSchema(newResp);
  if (!oldSchema || !newSchema) return changes;

  const oldProps = flattenObjectProperties(oldSchema);
  const newProps = flattenObjectProperties(newSchema);

  for (const propPath of Object.keys(oldProps)) {
    if (!(propPath in newProps)) {
      changes.push({
        type: "response-property-removed",
        path,
        method,
        statusCode,
        propertyPath: propPath,
        originalValue: safeStringify(oldProps[propPath]),
        wasDraft,
      });
    }
  }

  return changes;
}

function extractResponseSchema(resp: any): any {
  if (!resp?.content) return null;
  const mediaTypes = Object.values(resp.content);
  if (mediaTypes.length === 0) return null;
  return (mediaTypes[0] as any)?.schema ?? null;
}

function flattenObjectProperties(schema: any, prefix = ""): Record<string, any> {
  const result: Record<string, any> = {};
  if (!schema || typeof schema !== "object") return result;

  if (schema.properties) {
    for (const [key, value] of Object.entries<any>(schema.properties)) {
      const propPath = prefix ? `${prefix}.${key}` : key;
      result[propPath] = value;
      if (value?.properties) {
        Object.assign(result, flattenObjectProperties(value, propPath));
      }
    }
  }

  const composed = schema.allOf ?? schema.anyOf ?? schema.oneOf;
  if (composed) {
    for (const sub of composed) {
      Object.assign(result, flattenObjectProperties(sub, prefix));
    }
  }

  return result;
}

function safeStringify(value: any): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
