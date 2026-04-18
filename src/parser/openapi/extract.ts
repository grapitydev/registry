export interface ExtractedEndpoints {
  paths: string[];
  methods: Record<string, string[]>;
  schemas: string[];
  authSchemes: string[];
}

export async function extractFromOpenApiSpec(
  content: string
): Promise<ExtractedEndpoints> {
  throw new Error("Not implemented");
}