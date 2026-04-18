import type { Context } from "hono";

export function apiKeyAuth(apiKeyHashes: string[]) {
  return async (c: Context, next: () => Promise<void>) => {
    const apiKey = c.req.header("X-API-Key");
    if (!apiKey) {
      return c.json({ error: "unauthorized", message: "Missing API key", statusCode: 401 }, 401);
    }
    throw new Error("Not implemented");
  };
}