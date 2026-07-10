-- Razorpay checkout replaces Stripe subscriptions, but old Stripe columns stay
-- nullable for zero-downtime deploys while older server bundles are still live.
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "razorpayCustomerId" text,
  ADD COLUMN IF NOT EXISTS "stripeCustomerId" text;

ALTER TABLE "Subscription"
  ALTER COLUMN "stripeCustomerId" DROP NOT NULL,
  ALTER COLUMN "stripeSubscriptionId" DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS "razorpayCustomerId" text,
  ADD COLUMN IF NOT EXISTS "razorpayOrderId" text,
  ADD COLUMN IF NOT EXISTS "razorpayPaymentId" text,
  ADD COLUMN IF NOT EXISTS "amount" integer DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS "currency" varchar(8) DEFAULT 'INR' NOT NULL;

DROP INDEX IF EXISTS "Subscription_stripeSubscriptionId_idx";

CREATE UNIQUE INDEX IF NOT EXISTS "Subscription_stripeSubscriptionId_idx"
  ON "Subscription" ("stripeSubscriptionId")
  WHERE "stripeSubscriptionId" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "Subscription_razorpayOrderId_unique"
  ON "Subscription" ("razorpayOrderId")
  WHERE "razorpayOrderId" IS NOT NULL;
