import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { sql, eq, and, desc } from "drizzle-orm";
import { specs, specVersions, auditLog } from "@grapity/core";
import type {
  Spec,
  SpecVersion,
  SpecFilters,
  CompatReport,
  SpecStore,
  AuditAction,
} from "@grapity/core";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { v4 as uuid } from "uuid";

export class SQLiteSpecStore implements SpecStore {
  private db: BetterSQLite3Database;

  constructor(dbPath: string) {
    const sqlite = new Database(dbPath);
    sqlite.pragma("journal_mode = WAL");
    sqlite.pragma("foreign_keys = ON");
    this.db = drizzle(sqlite);
  }

  async migrate(): Promise<void> {
    await this.db.run(sql`CREATE TABLE IF NOT EXISTS specs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL CHECK(type IN ('openapi', 'asyncapi')),
      description TEXT,
      owner TEXT,
      source_repo TEXT,
      tags TEXT DEFAULT '[]',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`);

    await this.db.run(sql`CREATE TABLE IF NOT EXISTS spec_versions (
      id TEXT PRIMARY KEY,
      spec_id TEXT NOT NULL REFERENCES specs(id),
      semver TEXT NOT NULL,
      content TEXT NOT NULL,
      checksum TEXT NOT NULL,
      git_ref TEXT,
      pushed_by TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'deprecated', 'sunset')),
      sunset_date INTEGER,
      previous_version TEXT,
      force_reason TEXT,
      is_prerelease INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    )`);

    await this.db.run(sql`CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      action TEXT NOT NULL CHECK(action IN ('spec.push', 'spec.push.force', 'spec.deprecate', 'spec.sunset')),
      actor TEXT NOT NULL,
      spec_name TEXT NOT NULL,
      version TEXT,
      details TEXT,
      created_at INTEGER NOT NULL
    )`);

    await this.db.run(sql`CREATE INDEX IF NOT EXISTS idx_spec_versions_spec_id ON spec_versions(spec_id)`);
    await this.db.run(sql`CREATE INDEX IF NOT EXISTS idx_spec_versions_semver ON spec_versions(spec_id, semver)`);
    await this.db.run(sql`CREATE INDEX IF NOT EXISTS idx_audit_log_spec_name ON audit_log(spec_name)`);
    await this.db.run(sql`CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at)`);
  }

  async getSpec(name: string): Promise<Spec | null> {
    const rows = await this.db.select().from(specs).where(eq(specs.name, name)).limit(1);
    if (rows.length === 0) return null;
    return this.mapSpecRow(rows[0]);
  }

  async getSpecVersion(name: string, semver: string): Promise<SpecVersion | null> {
    const spec = await this.getSpec(name);
    if (!spec) return null;
    const rows = await this.db.select().from(specVersions)
      .where(and(eq(specVersions.specId, spec.id), eq(specVersions.semver, semver)))
      .limit(1);
    if (rows.length === 0) return null;
    return this.mapVersionRow(rows[0]);
  }

  async getLatestVersion(name: string): Promise<SpecVersion | null> {
    const spec = await this.getSpec(name);
    if (!spec) return null;
    const rows = await this.db.select().from(specVersions)
      .where(eq(specVersions.specId, spec.id))
      .orderBy(desc(specVersions.createdAt))
      .limit(1);
    if (rows.length === 0) return null;
    return this.mapVersionRow(rows[0]);
  }

  async listSpecs(filters?: SpecFilters): Promise<Spec[]> {
    const conditions = [];
    if (filters?.type) conditions.push(eq(specs.type, filters.type));
    if (filters?.owner) conditions.push(eq(specs.owner, filters.owner));

    const rows = conditions.length > 0
      ? await this.db.select().from(specs).where(and(...conditions))
      : await this.db.select().from(specs);
    return rows.map((r) => this.mapSpecRow(r));
  }

  async listVersions(name: string): Promise<SpecVersion[]> {
    const spec = await this.getSpec(name);
    if (!spec) return [];
    const rows = await this.db.select().from(specVersions)
      .where(eq(specVersions.specId, spec.id))
      .orderBy(desc(specVersions.createdAt));
    return rows.map((r) => this.mapVersionRow(r));
  }

  async pushSpecVersion(spec: Spec, version: SpecVersion): Promise<SpecVersion> {
    const existingSpec = await this.getSpec(spec.name);

    if (!existingSpec) {
      await this.db.insert(specs).values({
        id: spec.id,
        name: spec.name,
        type: spec.type,
        description: spec.description ?? null,
        owner: spec.owner ?? null,
        sourceRepo: spec.sourceRepo ?? null,
        tags: spec.tags ?? [],
        createdAt: spec.createdAt,
        updatedAt: spec.updatedAt,
      });
    } else {
      await this.db.update(specs)
        .set({ updatedAt: new Date() })
        .where(eq(specs.id, existingSpec.id));
    }

    const specId = existingSpec?.id ?? spec.id;
    await this.db.insert(specVersions).values({
      id: version.id,
      specId,
      semver: version.semver,
      content: version.content,
      checksum: version.checksum,
      gitRef: version.gitRef ?? null,
      pushedBy: version.pushedBy ?? null,
      status: version.status,
      sunsetDate: version.sunsetDate ?? null,
      previousVersion: version.previousVersion ?? null,
      forceReason: version.forceReason ?? null,
      isPrerelease: version.isPrerelease,
      createdAt: version.createdAt,
    });

    return version;
  }

  async deprecateVersion(name: string, semver: string, sunsetDate: Date): Promise<SpecVersion> {
    const version = await this.getSpecVersion(name, semver);
    if (!version) throw new Error(`Version ${semver} not found for spec ${name}`);

    await this.db.update(specVersions)
      .set({ status: "deprecated", sunsetDate })
      .where(eq(specVersions.id, version.id));

    return { ...version, status: "deprecated", sunsetDate };
  }

  async sunsetVersion(name: string, semver: string): Promise<SpecVersion> {
    const version = await this.getSpecVersion(name, semver);
    if (!version) throw new Error(`Version ${semver} not found for spec ${name}`);

    await this.db.update(specVersions)
      .set({ status: "sunset" })
      .where(eq(specVersions.id, version.id));

    return { ...version, status: "sunset" };
  }

  async getCompatReport(name: string, semver: string): Promise<CompatReport | null> {
    const version = await this.getSpecVersion(name, semver);
    return version?.compatibility ?? null;
  }

  async logAudit(
    action: AuditAction,
    actor: string,
    specName: string,
    version: string | undefined,
    details: Record<string, unknown> | undefined
  ): Promise<void> {
    await this.db.insert(auditLog).values({
      id: uuid(),
      action,
      actor,
      specName,
      version: version ?? null,
      details: details ?? null,
      createdAt: new Date(),
    });
  }

  private mapSpecRow(row: typeof specs.$inferSelect): Spec {
    return {
      id: row.id,
      name: row.name,
      type: row.type as "openapi" | "asyncapi",
      description: row.description ?? undefined,
      owner: row.owner ?? undefined,
      sourceRepo: row.sourceRepo ?? undefined,
      tags: (row.tags as string[]) ?? [],
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private mapVersionRow(row: typeof specVersions.$inferSelect): SpecVersion {
    return {
      id: row.id,
      specId: row.specId,
      semver: row.semver,
      content: row.content,
      checksum: row.checksum,
      gitRef: row.gitRef ?? undefined,
      pushedBy: row.pushedBy ?? undefined,
      status: row.status as "active" | "deprecated" | "sunset",
      sunsetDate: row.sunsetDate ?? undefined,
      previousVersion: row.previousVersion ?? undefined,
      forceReason: row.forceReason ?? undefined,
      isPrerelease: row.isPrerelease,
      createdAt: row.createdAt,
    };
  }
}