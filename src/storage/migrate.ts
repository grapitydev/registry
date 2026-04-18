import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { sql } from "drizzle-orm";

export async function runMigrations(db: BetterSQLite3Database): Promise<void> {
  await db.run(sql`CREATE TABLE IF NOT EXISTS specs (
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

  await db.run(sql`CREATE TABLE IF NOT EXISTS spec_versions (
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

  await db.run(sql`CREATE TABLE IF NOT EXISTS audit_log (
    id TEXT PRIMARY KEY,
    action TEXT NOT NULL CHECK(action IN ('spec.push', 'spec.push.force', 'spec.deprecate', 'spec.sunset')),
    actor TEXT NOT NULL,
    spec_name TEXT NOT NULL,
    version TEXT,
    details TEXT,
    created_at INTEGER NOT NULL
  )`);

  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_spec_versions_spec_id ON spec_versions(spec_id)`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_spec_versions_semver ON spec_versions(spec_id, semver)`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_audit_log_spec_name ON audit_log(spec_name)`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at)`);
}