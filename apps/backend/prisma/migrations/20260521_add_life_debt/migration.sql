-- F-14: Deuda de Vida
-- Sprint 17

-- CreateEnum
CREATE TYPE "LifeDebtItemType" AS ENUM ('task', 'habit', 'recurring_expense');

-- CreateEnum
CREATE TYPE "LifeDebtDecisionKind" AS ENUM ('commit', 'delegate', 'delete');

-- AlterTable: Task.rescheduleCount
ALTER TABLE "tasks" ADD COLUMN "rescheduleCount" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex for rescheduleCount lookup
CREATE INDEX "tasks_userId_rescheduleCount_idx" ON "tasks"("userId", "rescheduleCount");

-- AlterTable: RecurringExpense.lastReviewedAt
-- Nullable first, backfill from createdAt, then NOT NULL.
ALTER TABLE "recurring_expenses" ADD COLUMN "lastReviewedAt" TIMESTAMP(3);

UPDATE "recurring_expenses" SET "lastReviewedAt" = "createdAt" WHERE "lastReviewedAt" IS NULL;

ALTER TABLE "recurring_expenses" ALTER COLUMN "lastReviewedAt" SET NOT NULL;
ALTER TABLE "recurring_expenses" ALTER COLUMN "lastReviewedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex for lastReviewedAt lookup
CREATE INDEX "recurring_expenses_userId_lastReviewedAt_idx" ON "recurring_expenses"("userId", "lastReviewedAt");

-- CreateTable: life_debt_decisions
CREATE TABLE "life_debt_decisions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemType" "LifeDebtItemType" NOT NULL,
    "itemId" TEXT NOT NULL,
    "decision" "LifeDebtDecisionKind" NOT NULL,
    "commitDate" TIMESTAMP(3),
    "reason" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "life_debt_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "life_debt_decisions_userId_itemType_itemId_createdAt_idx"
    ON "life_debt_decisions"("userId", "itemType", "itemId", "createdAt" DESC);

CREATE INDEX "life_debt_decisions_userId_resolvedAt_idx"
    ON "life_debt_decisions"("userId", "resolvedAt");

-- AddForeignKey
ALTER TABLE "life_debt_decisions"
    ADD CONSTRAINT "life_debt_decisions_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
