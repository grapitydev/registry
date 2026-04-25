CREATE INDEX `idx_audit_log_spec_name` ON `audit_log` (`spec_name`);--> statement-breakpoint
CREATE INDEX `idx_audit_log_created_at` ON `audit_log` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_spec_versions_spec_id` ON `spec_versions` (`spec_id`);--> statement-breakpoint
CREATE INDEX `idx_spec_versions_semver` ON `spec_versions` (`spec_id`,`semver`);