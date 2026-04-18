export async function validateOpenApiSpec(content: string): Promise<{
  valid: boolean;
  errors: string[];
  warnings: string[];
}> {
  throw new Error("Not implemented");
}