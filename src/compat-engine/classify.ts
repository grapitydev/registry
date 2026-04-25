import { v4 as uuid } from "uuid";
import type { CompatReport, BreakingChange, SafeChange, VersionClassification } from "@grapity/core";
import type { RawChange } from "./differ";
import type { GraceViolation } from "./grace-period";

export interface ClassifyResult {
  compatReport: CompatReport;
  hasGraceViolations: boolean;
  hasOtherBreakingChanges: boolean;
}

export function classifyChanges(
  changes: RawChange[],
  graceViolations: GraceViolation[],
  previousVersion: string,
): ClassifyResult {
  const breakingChanges: BreakingChange[] = [];
  const safeChanges: SafeChange[] = [];
  let hasGraceViolations = false;
  let hasOtherBreakingChanges = false;

  const violationByKey = new Map<string, GraceViolation>();
  for (const v of graceViolations) {
    violationByKey.set(`${v.path}:${v.method}`, v);
  }

  for (const change of changes) {
    switch (change.type) {
      case "stable-endpoint-marked-draft":
        hasOtherBreakingChanges = true;
        breakingChanges.push({
          id: uuid(),
          rule: "stable-endpoint-marked-draft",
          description: `${change.method.toUpperCase()} ${change.path} cannot be downgraded from stable to draft`,
          path: `${change.path}/${change.method.toUpperCase()}`,
        });
        break;

      case "endpoint-removed": {
        if (change.wasDraft) {
          safeChanges.push({
            id: uuid(),
            rule: "draft-endpoint-changed",
            description: `${change.method.toUpperCase()} ${change.path} was removed (endpoint was marked x-draft)`,
            path: `${change.path}/${change.method.toUpperCase()}`,
          });
          break;
        }
        const violation = violationByKey.get(`${change.path}:${change.method}`);
        if (violation) {
          hasGraceViolations = true;
          breakingChanges.push({
            id: uuid(),
            rule: violation.rule,
            description: describeGraceViolation(change.path, change.method, violation),
            path: `${change.path}/${change.method.toUpperCase()}`,
            originalValue: "endpoint existed",
            newValue: "endpoint removed",
          });
        } else {
          breakingChanges.push({
            id: uuid(),
            rule: "endpoint-removed",
            description: `${change.method.toUpperCase()} ${change.path} was removed after its sunset date elapsed`,
            path: `${change.path}/${change.method.toUpperCase()}`,
            originalValue: "endpoint existed",
            newValue: "endpoint removed",
          });
        }
        break;
      }

      case "endpoint-added":
        safeChanges.push({
          id: uuid(),
          rule: "endpoint-added",
          description: `${change.method.toUpperCase()} ${change.path} was added`,
          path: `${change.path}/${change.method.toUpperCase()}`,
        });
        break;

      case "endpoint-deprecated":
        safeChanges.push({
          id: uuid(),
          rule: "endpoint-deprecated",
          description: `${change.method.toUpperCase()} ${change.path} was marked deprecated${change.xSunset ? ` (sunset: ${change.xSunset})` : ""}`,
          path: `${change.path}/${change.method.toUpperCase()}`,
        });
        break;

      case "required-param-added":
        if (change.wasDraft) {
          safeChanges.push({
            id: uuid(),
            rule: "draft-endpoint-changed",
            description: `Required ${change.paramIn} parameter '${change.paramName}' was added to draft endpoint ${change.method.toUpperCase()} ${change.path}`,
            path: `${change.path}/${change.method.toUpperCase()}/parameters/${change.paramName}`,
          });
          break;
        }
        hasOtherBreakingChanges = true;
        breakingChanges.push({
          id: uuid(),
          rule: "required-request-param-added",
          description: `Required ${change.paramIn} parameter '${change.paramName}' was added to ${change.method.toUpperCase()} ${change.path}`,
          path: `${change.path}/${change.method.toUpperCase()}/parameters/${change.paramName}`,
        });
        break;

      case "optional-param-added":
        safeChanges.push({
          id: uuid(),
          rule: "optional-request-param-added",
          description: `Optional ${change.paramIn} parameter '${change.paramName}' was added to ${change.method.toUpperCase()} ${change.path}`,
          path: `${change.path}/${change.method.toUpperCase()}/parameters/${change.paramName}`,
        });
        break;

      case "response-property-removed":
        if (change.wasDraft) {
          safeChanges.push({
            id: uuid(),
            rule: "draft-endpoint-changed",
            description: `Response property '${change.propertyPath}' was removed from draft endpoint ${change.method.toUpperCase()} ${change.path} (${change.statusCode})`,
            path: `${change.path}/${change.method.toUpperCase()}/response/${change.statusCode}/${change.propertyPath}`,
          });
          break;
        }
        hasOtherBreakingChanges = true;
        breakingChanges.push({
          id: uuid(),
          rule: "response-property-removed",
          description: `Response property '${change.propertyPath}' was removed from ${change.method.toUpperCase()} ${change.path} (${change.statusCode})`,
          path: `${change.path}/${change.method.toUpperCase()}/response/${change.statusCode}/${change.propertyPath}`,
          originalValue: change.originalValue,
          newValue: undefined,
        });
        break;

      case "response-status-removed":
        if (change.wasDraft) {
          safeChanges.push({
            id: uuid(),
            rule: "draft-endpoint-changed",
            description: `Response status ${change.statusCode} was removed from draft endpoint ${change.method.toUpperCase()} ${change.path}`,
            path: `${change.path}/${change.method.toUpperCase()}/responses/${change.statusCode}`,
          });
          break;
        }
        hasOtherBreakingChanges = true;
        breakingChanges.push({
          id: uuid(),
          rule: "response-status-removed",
          description: `Response status ${change.statusCode} was removed from ${change.method.toUpperCase()} ${change.path}`,
          path: `${change.path}/${change.method.toUpperCase()}/responses/${change.statusCode}`,
        });
        break;

      case "response-status-added":
        safeChanges.push({
          id: uuid(),
          rule: "response-status-added",
          description: `Response status ${change.statusCode} was added to ${change.method.toUpperCase()} ${change.path}`,
          path: `${change.path}/${change.method.toUpperCase()}/responses/${change.statusCode}`,
        });
        break;
    }
  }

  const classification: VersionClassification =
    breakingChanges.length > 0 ? "major"
    : safeChanges.length > 0 ? "minor"
    : "patch";

  return {
    compatReport: {
      previousVersion,
      classification,
      breakingChanges,
      safeChanges,
    },
    hasGraceViolations,
    hasOtherBreakingChanges,
  };
}

function describeGraceViolation(path: string, method: string, violation: GraceViolation): string {
  const endpoint = `${method.toUpperCase()} ${path}`;
  switch (violation.rule) {
    case "endpoint-removed-without-deprecation":
      return `${endpoint} was removed without first being marked as deprecated`;
    case "endpoint-removed-missing-sunset":
      return `${endpoint} is deprecated but has no x-sunset date set`;
    case "endpoint-removed-before-sunset":
      return `${endpoint} was removed before its sunset date (${violation.xSunset ?? "unknown"})`;
  }
}
