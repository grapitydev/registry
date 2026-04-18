import type { BreakingChange, SafeChange } from "@grapity/core";
import type { OasdiffResult } from "./oasdiff";

export function explainChanges(result: OasdiffResult): {
  breaking: BreakingChange[];
  safe: SafeChange[];
} {
  throw new Error("Not implemented");
}