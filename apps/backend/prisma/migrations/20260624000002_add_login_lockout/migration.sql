-- Per-account login lockout to defend against brute force that evades the
-- per-IP rate limiter (S-01.4)

-- AlterTable
ALTER TABLE "users" ADD COLUMN "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN "lockedUntil" TIMESTAMP(3);
