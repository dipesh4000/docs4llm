ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "disabled" boolean DEFAULT false NOT NULL;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "stripeCustomerId" text;

CREATE TABLE IF NOT EXISTS "Subscription" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "userId" uuid NOT NULL REFERENCES "User"("id"),
  "plan" varchar NOT NULL,
  "billingCycle" varchar NOT NULL,
  "status" varchar DEFAULT 'incomplete' NOT NULL,
  "stripeCustomerId" text NOT NULL,
  "stripeSubscriptionId" text NOT NULL,
  "currentPeriodStart" timestamp,
  "currentPeriodEnd" timestamp,
  "cancelAtPeriodEnd" boolean DEFAULT false NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "Subscription_stripeSubscriptionId_idx"
  ON "Subscription" ("stripeSubscriptionId");
