-- Persist /api/contact submissions so user messages are recoverable even when
-- email delivery is not configured or Resend is temporarily unavailable.

CREATE TABLE IF NOT EXISTS "ContactMessage" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar(120) NOT NULL,
  "email" varchar(200) NOT NULL,
  "subject" varchar(120),
  "orderId" varchar(120),
  "message" text NOT NULL,
  "ip" varchar(64) DEFAULT 'unknown' NOT NULL,
  "userAgent" text,
  "deliveryStatus" varchar DEFAULT 'pending' NOT NULL,
  "deliveryReason" text,
  "deliveredAt" timestamp,
  "createdAt" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "ContactMessage" ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS "ContactMessage_createdAt_idx"
  ON "ContactMessage" ("createdAt" DESC);

CREATE INDEX IF NOT EXISTS "ContactMessage_email_idx"
  ON "ContactMessage" ("email");

CREATE INDEX IF NOT EXISTS "ContactMessage_deliveryStatus_idx"
  ON "ContactMessage" ("deliveryStatus");
