import { pgTable, text, timestamp, boolean, jsonb, index } from "drizzle-orm/pg-core";
import type { CompatReport } from "@grapity/core";

export const specs = pgTable("specs", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  type: text("type", { enum: ["openapi", "asyncapi"] as [string, ...string[]] }).notNull(),
  description: text("description"),
  owner: text("owner"),
  sourceRepo: text("source_repo"),
  tags: jsonb("tags").$type<string[]>().default([]),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const specVersions = pgTable("spec_versions", {
  id: text("id").primaryKey(),
  specId: text("spec_id").notNull().references(() => specs.id),
  semver: text("semver").notNull(),
  content: text("content").notNull(),
  checksum: text("checksum").notNull(),
  gitRef: text("git_ref"),
  pushedBy: text("pushed_by"),
  compatibility: jsonb("compatibility").$type<CompatReport>(),
  previousVersion: text("previous_version"),
  forceReason: text("force_reason"),
  isPrerelease: boolean("is_prerelease").notNull().default(false),
  createdAt: timestamp("created_at").notNull(),
}, (table) => [
  index("idx_spec_versions_spec_id").on(table.specId),
  index("idx_spec_versions_semver").on(table.specId, table.semver),
]);

export const auditLog = pgTable("audit_log", {
  id: text("id").primaryKey(),
  action: text("action", { enum: ["spec.push", "spec.push.force"] as [string, ...string[]] }).notNull(),
  actor: text("actor").notNull(),
  specName: text("spec_name").notNull(),
  version: text("version"),
  details: jsonb("details").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").notNull(),
}, (table) => [
  index("idx_audit_log_spec_name").on(table.specName),
  index("idx_audit_log_created_at").on(table.createdAt),
]);
