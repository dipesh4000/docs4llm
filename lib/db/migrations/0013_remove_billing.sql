-- Remove billing tables (no longer needed for hackathon project)

DROP TABLE IF EXISTS "CreditLedger";
DROP TABLE IF EXISTS "CreditWallet";
DROP TABLE IF EXISTS "Subscription";

-- Remove Razorpay columns from User
ALTER TABLE "User" DROP COLUMN IF EXISTS "razorpayCustomerId";
