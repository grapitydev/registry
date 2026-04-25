import yaml from "js-yaml";
import SwaggerParser from "@apidevtools/swagger-parser";
import type { OpenAPI } from "openapi-types";

export async function validateOpenApiSpec(content: string): Promise<{
  valid: boolean;
  errors: string[];
  warnings: string[];
}> {
  let obj: unknown;
  try {
    obj = yaml.load(content);
  } catch (err) {
    return {
      valid: false,
      errors: [`YAML/JSON parse error: ${err instanceof Error ? err.message : String(err)}`],
      warnings: [],
    };
  }

  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    return { valid: false, errors: ["Spec content is not a valid YAML/JSON object"], warnings: [] };
  }

  try {
    await SwaggerParser.validate(obj as OpenAPI.Document);
    return { valid: true, errors: [], warnings: [] };
  } catch (err) {
    return {
      valid: false,
      errors: [err instanceof Error ? err.message : String(err)],
      warnings: [],
    };
  }
}
