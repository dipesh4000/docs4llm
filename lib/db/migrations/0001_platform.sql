CREATE TABLE IF NOT EXISTS "PlatformProject" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "userId" uuid NOT NULL REFERENCES "User"("id"),
  "name" text NOT NULL,
  "sourceUrl" text,
  "sourceType" varchar NOT NULL,
  "status" varchar DEFAULT 'pending' NOT NULL,
  "artifacts" json,
  "crawlData" json,
  "logs" json,
  "tokenUsage" json,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "McpServer" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "projectId" uuid NOT NULL REFERENCES "PlatformProject"("id"),
  "userId" uuid NOT NULL REFERENCES "User"("id"),
  "name" text NOT NULL,
  "config" json NOT NULL,
  "tools" json NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "AiWorkflow" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "projectId" uuid REFERENCES "PlatformProject"("id"),
  "userId" uuid NOT NULL REFERENCES "User"("id"),
  "name" text NOT NULL,
  "nodes" json NOT NULL,
  "edges" json NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);
