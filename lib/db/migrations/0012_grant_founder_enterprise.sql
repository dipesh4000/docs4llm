-- Enable founder account (idempotent).
UPDATE "User"
SET "disabled" = false
WHERE lower(email) = 'gautammanak1@gmail.com';
