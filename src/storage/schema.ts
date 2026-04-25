import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import type { CompatReport } from "@grapity/core";

export const specs = sqliteTable("specs", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  type: text("type", { enum: ["openapi", "asyncapi"] }).notNull(),
  description: text("description"),
  owner: text("owner"),
  sourceRepo: text("source_repo"),
  tags: text("tags", { mode: "json" }).$type<string[]>().default([]),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const specVersions = sqliteTable("spec_versions", {
  id: text("id").primaryKey(),
  specId: text("spec_id").notNull().references(() => specs.id),
  semver: text("semver").notNull(),
  content: text("content").notNull(),
  checksum: text("checksum").notNull(),
  gitRef: text("git_ref"),
  pushedBy: text("pushed_by"),
  compatibility: text("compatibility", { mode: "json" }).$type<CompatReport>(),
  previousVersion: text("previous_version"),
  forceReason: text("force_reason"),
  isPrerelease: integer("is_prerelease", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
}, (table) => [
  index("idx_spec_versions_spec_id").on(table.specId),
  index("idx_spec_versions_semver").on(table.specId, table.semver),
]);

export const auditLog = sqliteTable("audit_log", {
  id: text("id").primaryKey(),
  action: text("action", { enum: ["spec.push", "spec.push.force"] }).notNull(),
  actor: text("actor").notNull(),
  specName: text("spec_name").notNull(),
  version: text("version"),
  details: text("details", { mode: "json" }).$type<Record<string, unknown>>(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
}, (table) => [
  index("idx_audit_log_spec_name").on(table.specName),
  index("idx_audit_log_created_at").on(table.createdAt),
]);
