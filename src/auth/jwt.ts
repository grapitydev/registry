import type { Context } from "hono";

export function jwtAuth(jwtSecret: string) {
  return async (c: Context, next: () => Promise<void>) => {
    throw new Error("Not implemented");
  };
}