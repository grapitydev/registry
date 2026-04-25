import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { sql, eq, and, desc, asc } from "drizzle-orm";
import path from "node:path";
import { specs, specVersions, auditLog } from "./schema";
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
import { SQLITE_MIGRATIONS_FOLDER } from "../paths";

const MIGRATIONS_FOLDER = SQLITE_MIGRATIONS_FOLDER;

export class SQLiteSpecStore implements SpecStore {
  private db: BetterSQLite3Database;

  constructor(dbPath: string) {
    const sqlite = new Database(dbPath);
    this.db = drizzle(sqlite);
  }

  async migrate(): Promise<void> {
    await migrate(this.db, {
      migrationsFolder: MIGRATIONS_FOLDER,
    });
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
      .orderBy(desc(specVersions.createdAt), desc(sql`rowid`))
      .limit(1);
    if (rows.length === 0) return null;
    return this.mapVersionRow(rows[0]);
  }

  async listSpecs(filters?: SpecFilters): Promise<Spec[]> {
    const conditions = [];
    if (filters?.type) conditions.push(eq(specs.type, filters.type));
    if (filters?.owner) conditions.push(eq(specs.owner, filters.owner));

    let rows = conditions.length > 0
      ? await this.db.select().from(specs).where(and(...conditions))
      : await this.db.select().from(specs);

    if (filters?.tags && filters.tags.length > 0) {
      rows = rows.filter((row) => {
        const rowTags = (row.tags as string[]) ?? [];
        return filters.tags!.every((tag) => rowTags.includes(tag));
      });
    }

    return rows.map((r) => this.mapSpecRow(r));
  }

  async listVersions(name: string): Promise<SpecVersion[]> {
    const spec = await this.getSpec(name);
    if (!spec) return [];
    const rows = await this.db.select().from(specVersions)
      .where(eq(specVersions.specId, spec.id))
      .orderBy(desc(specVersions.createdAt), desc(sql`rowid`));
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
      compatibility: version.compatibility ?? null,
      previousVersion: version.previousVersion ?? null,
      forceReason: version.forceReason ?? null,
      isPrerelease: version.isPrerelease,
      createdAt: version.createdAt,
    });

    return version;
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
      compatibility: (row.compatibility as CompatReport | null) ?? undefined,
      previousVersion: row.previousVersion ?? undefined,
      forceReason: row.forceReason ?? undefined,
      isPrerelease: row.isPrerelease,
      createdAt: row.createdAt,
    };
  }
}
