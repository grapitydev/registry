import type { RawChange } from "./differ";

export type GraceViolationRule =
  | "endpoint-removed-without-deprecation"
  | "endpoint-removed-missing-sunset"
  | "endpoint-removed-before-sunset";

export interface GraceViolation {
  path: string;
  method: string;
  rule: GraceViolationRule;
  xSunset?: string;
}

export function checkGracePeriod(changes: RawChange[]): GraceViolation[] {
  const violations: GraceViolation[] = [];
  const now = new Date();

  for (const change of changes) {
    if (change.type !== "endpoint-removed") continue;
    if (change.wasDraft) continue;

    if (!change.wasDeprecated) {
      violations.push({ path: change.path, method: change.method, rule: "endpoint-removed-without-deprecation" });
      continue;
    }

    if (!change.xSunset) {
      violations.push({ path: change.path, method: change.method, rule: "endpoint-removed-missing-sunset" });
      continue;
    }

    const sunsetDate = new Date(change.xSunset);
    if (isNaN(sunsetDate.getTime()) || sunsetDate >= now) {
      violations.push({
        path: change.path,
        method: change.method,
        rule: "endpoint-removed-before-sunset",
        xSunset: change.xSunset,
      });
    }
  }

  return violations;
}
