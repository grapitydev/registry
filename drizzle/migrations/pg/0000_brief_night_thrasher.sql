CREATE TABLE "audit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"action" text NOT NULL,
	"actor" text NOT NULL,
	"spec_name" text NOT NULL,
	"version" text,
	"details" jsonb,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "spec_versions" (
	"id" text PRIMARY KEY NOT NULL,
	"spec_id" text NOT NULL,
	"semver" text NOT NULL,
	"content" text NOT NULL,
	"checksum" text NOT NULL,
	"git_ref" text,
	"pushed_by" text,
	"compatibility" jsonb,
	"previous_version" text,
	"force_reason" text,
	"is_prerelease" boolean DEFAULT false NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "specs" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"description" text,
	"owner" text,
	"source_repo" text,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "specs_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "spec_versions" ADD CONSTRAINT "spec_versions_spec_id_specs_id_fk" FOREIGN KEY ("spec_id") REFERENCES "public"."specs"("id") ON DELETE no action ON UPDATE no action;