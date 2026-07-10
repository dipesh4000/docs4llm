-- Teams & credit wallets.
--
-- These tables already exist in the live database; this migration documents
-- them in source control and makes a fresh database match. Every statement is
-- idempotent (IF NOT EXISTS), so re-running it against an environment that
-- already has the tables is a no-op and never mutates existing data.

CREATE TABLE IF NOT EXISTS "Team" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "slug" varchar NOT NULL,
  "ownerId" uuid NOT NULL REFERENCES "User"("id"),
  "plan" varchar DEFAULT 'team' NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "Team_slug_idx" ON "Team" ("slug");
CREATE INDEX IF NOT EXISTS "Team_ownerId_idx" ON "Team" ("ownerId");

CREATE TABLE IF NOT EXISTS "TeamMember" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "teamId" uuid NOT NULL REFERENCES "Team"("id"),
  "userId" uuid NOT NULL REFERENCES "User"("id"),
  "role" varchar DEFAULT 'member' NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "TeamMember_team_user_idx"
  ON "TeamMember" ("teamId", "userId");
CREATE INDEX IF NOT EXISTS "TeamMember_userId_idx" ON "TeamMember" ("userId");

CREATE TABLE IF NOT EXISTS "TeamInvite" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "teamId" uuid NOT NULL REFERENCES "Team"("id"),
  "email" varchar NOT NULL,
  "role" varchar DEFAULT 'member' NOT NULL,
  "invitedBy" uuid NOT NULL REFERENCES "User"("id"),
  "tokenHash" varchar NOT NULL,
  "status" varchar DEFAULT 'pending' NOT NULL,
  "expiresAt" timestamp NOT NULL,
  "acceptedAt" timestamp,
  "revokedAt" timestamp,
  "createdAt" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "TeamInvite_teamId_idx" ON "TeamInvite" ("teamId");
CREATE INDEX IF NOT EXISTS "TeamInvite_email_idx" ON "TeamInvite" ("email");

CREATE TABLE IF NOT EXISTS "CreditWallet" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "userId" uuid REFERENCES "User"("id"),
  "teamId" uuid REFERENCES "Team"("id"),
  "balance" integer DEFAULT 0 NOT NULL,
  "monthlyAllowance" integer DEFAULT 0 NOT NULL,
  "monthlyUsed" integer DEFAULT 0 NOT NULL,
  "monthAnchor" timestamp DEFAULT now() NOT NULL,
  "plan" varchar DEFAULT 'free' NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "CreditWallet_userId_idx" ON "CreditWallet" ("userId");
CREATE INDEX IF NOT EXISTS "CreditWallet_teamId_idx" ON "CreditWallet" ("teamId");

CREATE TABLE IF NOT EXISTS "CreditLedger" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "walletId" uuid NOT NULL REFERENCES "CreditWallet"("id"),
  "delta" integer NOT NULL,
  "reason" varchar NOT NULL,
  "projectId" uuid REFERENCES "PlatformProject"("id"),
  "metadata" jsonb,
  "idemKey" varchar,
  "createdAt" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "CreditLedger_walletId_idx"
  ON "CreditLedger" ("walletId");
CREATE INDEX IF NOT EXISTS "CreditLedger_createdAt_idx"
  ON "CreditLedger" ("createdAt" DESC);

ALTER TABLE "Team" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TeamMember" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TeamInvite" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CreditWallet" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CreditLedger" ENABLE ROW LEVEL SECURITY;
