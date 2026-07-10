-- Platform runtime tables already present in staging.
--
-- This migration records them in source control so fresh databases get the
-- same project pages, pipeline state, event log, rate limit, and release
-- metadata tables. Existing environments are protected by IF NOT EXISTS.

CREATE TABLE IF NOT EXISTS "Page" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "projectId" uuid NOT NULL REFERENCES "PlatformProject"("id"),
  "url" text NOT NULL,
  "title" text NOT NULL,
  "contentType" varchar DEFAULT 'page' NOT NULL,
  "content" text NOT NULL,
  "contentHash" varchar,
  "bytes" integer,
  "createdAt" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "Page_projectId_idx" ON "Page" ("projectId");
CREATE INDEX IF NOT EXISTS "Page_url_idx" ON "Page" ("url");

CREATE TABLE IF NOT EXISTS "PipelineJob" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "projectId" uuid NOT NULL REFERENCES "PlatformProject"("id"),
  "userId" uuid NOT NULL REFERENCES "User"("id"),
  "status" varchar DEFAULT 'queued' NOT NULL,
  "phase" varchar DEFAULT 'queued' NOT NULL,
  "progress" integer DEFAULT 0 NOT NULL,
  "attempt" integer DEFAULT 1 NOT NULL,
  "errorClass" varchar,
  "errorMessage" text,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL,
  "finishedAt" timestamp
);

CREATE INDEX IF NOT EXISTS "PipelineJob_projectId_idx"
  ON "PipelineJob" ("projectId");
CREATE INDEX IF NOT EXISTS "PipelineJob_userId_idx" ON "PipelineJob" ("userId");
CREATE INDEX IF NOT EXISTS "PipelineJob_status_idx" ON "PipelineJob" ("status");

CREATE SEQUENCE IF NOT EXISTS "ProjectEvent_seq_seq";

CREATE TABLE IF NOT EXISTS "ProjectEvent" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "projectId" uuid NOT NULL REFERENCES "PlatformProject"("id"),
  "seq" integer DEFAULT nextval('"ProjectEvent_seq_seq"'::regclass) NOT NULL,
  "type" varchar NOT NULL,
  "level" varchar DEFAULT 'info' NOT NULL,
  "phase" varchar,
  "message" text,
  "data" jsonb,
  "createdAt" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "ProjectEvent_projectId_seq_idx"
  ON "ProjectEvent" ("projectId", "seq");
CREATE INDEX IF NOT EXISTS "ProjectEvent_projectId_createdAt_idx"
  ON "ProjectEvent" ("projectId", "createdAt" DESC);

CREATE TABLE IF NOT EXISTS "IpRateLimit" (
  "ip" varchar PRIMARY KEY NOT NULL,
  "count" integer DEFAULT 0 NOT NULL,
  "resetAt" timestamp NOT NULL
);

CREATE TABLE IF NOT EXISTS "McpServerRelease" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "projectId" uuid NOT NULL REFERENCES "PlatformProject"("id"),
  "userId" uuid NOT NULL REFERENCES "User"("id"),
  "slug" varchar NOT NULL,
  "version" varchar DEFAULT '1.0.0' NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "serverJson" jsonb NOT NULL,
  "isPublic" boolean DEFAULT false NOT NULL,
  "githubRepoUrl" text,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "McpServerRelease_projectId_idx"
  ON "McpServerRelease" ("projectId");
CREATE INDEX IF NOT EXISTS "McpServerRelease_userId_idx"
  ON "McpServerRelease" ("userId");
CREATE INDEX IF NOT EXISTS "McpServerRelease_slug_idx"
  ON "McpServerRelease" ("slug");

ALTER TABLE "Page" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PipelineJob" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProjectEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "IpRateLimit" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "McpServerRelease" ENABLE ROW LEVEL SECURITY;
