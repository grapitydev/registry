import { v4 as uuid } from "uuid";
import type { Spec, SpecVersion, SpecStore, SpecFilters, CompatReport } from "@grapity/core";
import { computeChecksum } from "../utils";
import { parseOpenApiSpec } from "../parser/openapi/parse";
import { diffSpecs } from "../compat-engine/differ";
import { checkGracePeriod } from "../compat-engine/grace-period";
import { classifyChanges } from "../compat-engine/classify";
import type { VersionClassification } from "@grapity/core";

export class BreakingChangeError extends Error {
  constructor(public readonly compatReport: CompatReport) {
    super("Breaking changes detected");
    this.name = "BreakingChangeError";
  }
}

export class PrereleaseConstraintError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PrereleaseConstraintError";
  }
}

export class RegistryService {
  constructor(private store: SpecStore) {}

  async pushSpec(
    content: string,
    name: string,
    options?: {
      type?: "openapi" | "asyncapi";
      description?: string;
      owner?: string;
      sourceRepo?: string;
      tags?: string[];
      gitRef?: string;
      pushedBy?: string;
      version?: string;
      prerelease?: boolean;
      force?: boolean;
      reason?: string;
    }
  ): Promise<{
    spec: Spec;
    version: SpecVersion;
    compatReport?: CompatReport;
    isNewSpec: boolean;
  }> {
    const prerelease = options?.prerelease ?? false;
    const existingSpec = await this.store.getSpec(name);
    const isNewSpec = !existingSpec;
    const checksum = computeChecksum(content);

    let spec: Spec;
    let compatReport: CompatReport | undefined;
    let semver: string;
    let previousVersion: string | undefined;

    if (isNewSpec) {
      spec = {
        id: uuid(),
        name,
        type: options?.type ?? "openapi",
        description: options?.description,
        owner: options?.owner,
        sourceRepo: options?.sourceRepo,
        tags: options?.tags ?? [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      semver = options?.version ?? (prerelease ? "0.1.0" : "1.0.0");
    } else {
      spec = existingSpec;
      const latestVersion = await this.store.getLatestVersion(name);

      if (prerelease && latestVersion && !latestVersion.isPrerelease) {
        throw new PrereleaseConstraintError(
          `Cannot push pre-release version. ${name}@${latestVersion.semver} is already a release version.`
        );
      }

      if (!latestVersion) {
        semver = options?.version ?? (prerelease ? "0.1.0" : "1.0.0");
      } else {
        previousVersion = latestVersion.semver;

        const oldSpec = parseOpenApiSpec(latestVersion.content);
        const newSpec = parseOpenApiSpec(content);
        const changes = diffSpecs(oldSpec, newSpec);
        const graceViolations = checkGracePeriod(changes);
        const { compatReport: report, hasGraceViolations, hasOtherBreakingChanges } = classifyChanges(
          changes,
          graceViolations,
          previousVersion,
        );

        const isBlocked = !options?.force && (
          hasGraceViolations ||
          (hasOtherBreakingChanges && !this.isValidMajorDeclaration(latestVersion.semver, options?.version))
        );

        if (isBlocked) {
          throw new BreakingChangeError(report);
        }

        if (options?.version) {
          semver = options.version;
        } else if (prerelease) {
          const level = report.classification === "patch" ? "patch" : "minor";
          semver = this.bumpPreRelease(latestVersion.semver, level);
        } else if (latestVersion.isPrerelease) {
          semver = "1.0.0";
        } else {
          semver = this.bumpRelease(latestVersion.semver, report.classification);
        }

        compatReport = { ...report, suggestedVersion: semver };
      }
    }

    const version: SpecVersion = {
      id: uuid(),
      specId: spec.id,
      semver,
      content,
      checksum,
      gitRef: options?.gitRef,
      pushedBy: options?.pushedBy,
      compatibility: compatReport,
      previousVersion,
      forceReason: options?.force ? options.reason : undefined,
      isPrerelease: prerelease,
      createdAt: new Date(),
    };

    await this.store.pushSpecVersion(spec, version);

    const auditAction = options?.force ? "spec.push.force" : "spec.push";
    await this.store.logAudit(auditAction, options?.pushedBy ?? "unknown", name, semver, {
      breakingChanges: compatReport?.breakingChanges.length ?? 0,
      safeChanges: compatReport?.safeChanges.length ?? 0,
      forced: options?.force ?? false,
      reason: options?.reason,
    });

    return { spec, version, compatReport, isNewSpec };
  }

  async listSpecs(filters?: SpecFilters) {
    return this.store.listSpecs(filters);
  }

  async getSpec(name: string) {
    const spec = await this.store.getSpec(name);
    if (!spec) return null;
    const latestVersion = await this.store.getLatestVersion(name);
    return { spec, latestVersion: latestVersion ?? undefined };
  }

  async listVersions(name: string) {
    return this.store.listVersions(name);
  }

  async getVersion(name: string, semver: string) {
    return this.store.getSpecVersion(name, semver);
  }

  async getCompatReport(name: string, semver: string) {
    return this.store.getCompatReport(name, semver);
  }

  private isValidMajorDeclaration(currentSemver: string, declaredVersion?: string): boolean {
    if (!declaredVersion) return false;
    return this.isMajorBump(currentSemver, declaredVersion);
  }

  private isMajorBump(from: string, to: string): boolean {
    const f = from.split(".").map(Number);
    const t = to.split(".").map(Number);
    if (f.length !== 3 || t.length !== 3) return false;
    return t[0] > f[0];
  }

  private bumpRelease(current: string, classification: VersionClassification | "initial"): string {
    const parts = current.split(".").map(Number);
    if (parts.length !== 3) return "1.0.0";
    const [major, minor, patch] = parts;
    switch (classification) {
      case "major": return `${major + 1}.0.0`;
      case "minor": return `${major}.${minor + 1}.0`;
      case "patch": return `${major}.${minor}.${patch + 1}`;
      default: return `${major}.${minor + 1}.0`;
    }
  }

  private bumpPreRelease(current: string, level: "minor" | "patch"): string {
    const parts = current.split(".").map(Number);
    if (parts.length !== 3) return "0.1.0";
    const [major, minor, patch] = parts;
    switch (level) {
      case "minor": return `${major}.${minor + 1}.0`;
      case "patch": return `${major}.${minor}.${patch + 1}`;
    }
  }
}
