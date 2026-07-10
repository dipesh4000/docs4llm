-- Company MCP ownership, custom domains, and per-hit attribution.

ALTER TABLE "PlatformProject"
  ADD COLUMN IF NOT EXISTS "ownerType" varchar DEFAULT 'developer' NOT NULL;

ALTER TABLE "PlatformProject"
  ADD COLUMN IF NOT EXISTS "teamId" uuid;

ALTER TABLE "PlatformProject"
  ADD COLUMN IF NOT EXISTS "customDomain" text;

ALTER TABLE "PlatformProject"
  ADD COLUMN IF NOT EXISTS "customDomainVerified" boolean DEFAULT false NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "PlatformProject_customDomain_unique"
  ON "PlatformProject" ("customDomain")
  WHERE "customDomain" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "PlatformProject_teamId_idx"
  ON "PlatformProject" ("teamId");

CREATE TABLE IF NOT EXISTS "McpHit" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "projectId" uuid NOT NULL REFERENCES "PlatformProject"("id") ON DELETE CASCADE,
  "ownerType" varchar DEFAULT 'developer' NOT NULL,
  "teamId" uuid,
  "day" varchar(10) NOT NULL,
  "count" integer DEFAULT 0 NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "McpHit_project_day_unique"
  ON "McpHit" ("projectId", "day");

CREATE INDEX IF NOT EXISTS "McpHit_teamId_idx" ON "McpHit" ("teamId");
