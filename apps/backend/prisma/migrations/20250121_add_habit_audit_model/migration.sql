-- CreateEnum
CREATE TYPE "ChangeType" AS ENUM ('CREATED', 'UPDATED', 'DELETED', 'REACTIVATED');

-- CreateTable
CREATE TABLE "habit_audits" (
    "id" TEXT NOT NULL,
    "habitId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "changeType" "ChangeType" NOT NULL,
    "fieldChanged" VARCHAR(100),
    "oldValue" TEXT,
    "newValue" TEXT,
    "reason" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "habit_audits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "habit_audits_habitId_createdAt_idx" ON "habit_audits"("habitId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "habit_audits_userId_idx" ON "habit_audits"("userId");

-- AddForeignKey
ALTER TABLE "habit_audits" ADD CONSTRAINT "habit_audits_habitId_fkey" FOREIGN KEY ("habitId") REFERENCES "habits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habit_audits" ADD CONSTRAINT "habit_audits_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
