import type { CompatReport } from "@grapity/core";

export interface OasdiffResult {
  breakingChanges: Array<{ rule: string; description: string; path: string }>;
  safeChanges: Array<{ rule: string; description: string; path: string }>;
  exitCode: number;
}

export async function runOasdiff(
  oldSpec: string,
  newSpec: string
): Promise<OasdiffResult> {
  throw new Error("Not implemented");
}