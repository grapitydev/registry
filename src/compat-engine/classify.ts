import type { VersionClassification } from "@grapity/core";
import type { OasdiffResult } from "./oasdiff";

export interface ClassifiedResult {
  classification: VersionClassification;
  suggestedVersion?: string;
}

export function classifyChanges(
  result: OasdiffResult,
  currentVersion?: string
): ClassifiedResult {
  throw new Error("Not implemented");
}