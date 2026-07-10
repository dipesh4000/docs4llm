CREATE TABLE IF NOT EXISTS "JobMetric" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "jobType" varchar NOT NULL,
  "projectId" uuid REFERENCES "PlatformProject"("id") ON DELETE SET NULL,
  "userId" uuid REFERENCES "User"("id") ON DELETE SET NULL,
  "status" varchar NOT NULL,
  "attempt" varchar(4) DEFAULT '1' NOT NULL,
  "durationMs" varchar(20),
  "errorClass" varchar(64),
  "errorMessage" text,
  "traceId" varchar(64),
  "metadata" json,
  "startedAt" timestamp DEFAULT now() NOT NULL,
  "finishedAt" timestamp
);

CREATE INDEX IF NOT EXISTS "JobMetric_jobType_status_startedAt_idx"
  ON "JobMetric" ("jobType", "status", "startedAt" DESC);

CREATE INDEX IF NOT EXISTS "JobMetric_projectId_startedAt_idx"
  ON "JobMetric" ("projectId", "startedAt" DESC);

CREATE INDEX IF NOT EXISTS "JobMetric_status_startedAt_idx"
  ON "JobMetric" ("status", "startedAt" DESC);
