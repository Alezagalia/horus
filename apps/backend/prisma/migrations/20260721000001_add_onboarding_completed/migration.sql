-- Onboarding wizard flag (persisted server-side so it survives reinstalls)
ALTER TABLE "users" ADD COLUMN "onboardingCompletedAt" TIMESTAMP(3);

-- Backfill: existing users must never see the wizard
UPDATE "users" SET "onboardingCompletedAt" = NOW();
