-- AlterTable: Add streak tracking fields to habits table
-- Sprint 4 - US-031

ALTER TABLE "habits" ADD COLUMN "currentStreak" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "habits" ADD COLUMN "longestStreak" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "habits" ADD COLUMN "lastCompletedDate" DATE;
