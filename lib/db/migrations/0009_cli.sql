-- CLI auth tables + PlatformProject.source column for terminal vs web conversions.

ALTER TABLE "PlatformProject"
  ADD COLUMN IF NOT EXISTS "source" varchar DEFAULT 'web' NOT NULL;

CREATE TABLE IF NOT EXISTS "CliAuthRequest" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "deviceCodeHash" varchar(128) NOT NULL UNIQUE,
  "userCode" varchar(16) NOT NULL UNIQUE,
  "status" varchar DEFAULT 'pending' NOT NULL,
  "userId" uuid REFERENCES "User"("id"),
  "cliTokenId" uuid,
  "issuedTokenPlaintext" text,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "expiresAt" timestamp NOT NULL
);

CREATE INDEX IF NOT EXISTS "CliAuthRequest_userCode_idx" ON "CliAuthRequest" ("userCode");
CREATE INDEX IF NOT EXISTS "CliAuthRequest_status_idx" ON "CliAuthRequest" ("status");

CREATE TABLE IF NOT EXISTS "CliToken" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "userId" uuid NOT NULL REFERENCES "User"("id"),
  "tokenHash" varchar(128) NOT NULL UNIQUE,
  "name" varchar(120) DEFAULT 'CLI' NOT NULL,
  "lastUsedAt" timestamp,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "revokedAt" timestamp
);

CREATE INDEX IF NOT EXISTS "CliToken_userId_idx" ON "CliToken" ("userId");
CREATE INDEX IF NOT EXISTS "CliToken_tokenHash_idx" ON "CliToken" ("tokenHash");
