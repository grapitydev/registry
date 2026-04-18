import type {
  Spec,
  SpecVersion,
  SpecFilters,
  CompatReport,
  SpecStore,
  AuditAction,
} from "@grapity/core";

export class PostgreSQLSpecStore implements SpecStore {
  constructor(postgresUrl: string) {
    throw new Error("PostgreSQL adapter not yet implemented");
  }

  async getSpec(name: string): Promise<Spec | null> {
    throw new Error("Not implemented");
  }

  async getSpecVersion(name: string, semver: string): Promise<SpecVersion | null> {
    throw new Error("Not implemented");
  }

  async getLatestVersion(name: string): Promise<SpecVersion | null> {
    throw new Error("Not implemented");
  }

  async listSpecs(filters?: SpecFilters): Promise<Spec[]> {
    throw new Error("Not implemented");
  }

  async listVersions(name: string): Promise<SpecVersion[]> {
    throw new Error("Not implemented");
  }

  async pushSpecVersion(spec: Spec, version: SpecVersion): Promise<SpecVersion> {
    throw new Error("Not implemented");
  }

  async deprecateVersion(name: string, semver: string, sunsetDate: Date): Promise<SpecVersion> {
    throw new Error("Not implemented");
  }

  async sunsetVersion(name: string, semver: string): Promise<SpecVersion> {
    throw new Error("Not implemented");
  }

  async getCompatReport(name: string, semver: string): Promise<CompatReport | null> {
    throw new Error("Not implemented");
  }

  async logAudit(
    action: AuditAction,
    actor: string,
    specName: string,
    version: string | undefined,
    details: Record<string, unknown> | undefined
  ): Promise<void> {
    throw new Error("Not implemented");
  }
}