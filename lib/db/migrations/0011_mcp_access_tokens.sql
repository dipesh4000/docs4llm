CREATE TABLE IF NOT EXISTS "McpAccessToken" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "userId" uuid NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "tokenHash" varchar(128) NOT NULL UNIQUE,
  "name" varchar(120) NOT NULL DEFAULT 'Marketplace',
  "lastUsedAt" timestamp,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "revokedAt" timestamp
);

CREATE INDEX IF NOT EXISTS "McpAccessToken_userId_idx"
  ON "McpAccessToken" ("userId");
