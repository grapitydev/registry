import yaml from "js-yaml";

export function parseOpenApiSpec(content: string): { paths?: Record<string, Record<string, any>> } {
  const obj = yaml.load(content);
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    throw new Error("Invalid spec content: not a valid YAML/JSON object");
  }
  return obj as { paths?: Record<string, Record<string, any>> };
}
