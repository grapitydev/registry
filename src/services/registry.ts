import { v4 as uuid } from "uuid";
import type {
  Spec,
  SpecVersion,
  SpecStore,
  SpecFilters,
  CompatReport,
  AuditAction,
} from "@grapity/core";
import { computeChecksum } from "../utils";

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
      semver = prerelease ? "0.1.0" : "1.0.0";
    } else {
      spec = existingSpec;
      const latestVersion = await this.store.getLatestVersion(name);
      if (!latestVersion) {
        semver = prerelease ? "0.1.0" : "1.0.0";
      } else {
        previousVersion = latestVersion.semver;

        if (prerelease) {
          if (!latestVersion.isPrerelease && latestVersion.semver !== "0.0.0") {
            throw new Error(
              `Cannot push pre-release version. ${name}@${latestVersion.semver} is already a release version. Pre-release versions can only be pushed when the latest version is also pre-release.`
            );
          }
        }

        const classification = latestVersion.isPrerelease
          ? this.bumpPreRelease(latestVersion.semver, "minor")
          : this.bumpRelease(latestVersion.semver, "minor");

        semver = classification;
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
      status: "active",
      previousVersion,
      forceReason: options?.force ? options.reason : undefined,
      isPrerelease: prerelease,
      createdAt: new Date(),
    };

    await this.store.pushSpecVersion(spec, version);

    const auditAction: AuditAction = options?.force ? "spec.push.force" : "spec.push";
    await this.store.logAudit(
      auditAction,
      options?.pushedBy ?? "unknown",
      name,
      semver,
      {
        breakingChanges: compatReport?.breakingChanges.length ?? 0,
        safeChanges: compatReport?.safeChanges.length ?? 0,
        forced: options?.force ?? false,
        reason: options?.reason,
      }
    );

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

  async deprecateVersion(
    name: string,
    semver: string,
    sunsetDate: Date,
    actor?: string
  ) {
    const version = await this.store.deprecateVersion(name, semver, sunsetDate);
    await this.store.logAudit("spec.deprecate", actor ?? "unknown", name, semver, {
      sunsetDate: sunsetDate.toISOString(),
    });
    return version;
  }

  async sunsetVersion(name: string, semver: string, actor?: string) {
    const version = await this.store.sunsetVersion(name, semver);
    await this.store.logAudit("spec.sunset", actor ?? "unknown", name, semver, {});
    return version;
  }

  private bumpRelease(current: string, level: "major" | "minor" | "patch"): string {
    const parts = current.split(".").map(Number);
    if (parts.length !== 3) return "1.0.0";
    const [major, minor, patch] = parts;
    switch (level) {
      case "major": return `${major + 1}.0.0`;
      case "minor": return `${major}.${minor + 1}.0`;
      case "patch": return `${major}.${minor}.${patch + 1}`;
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