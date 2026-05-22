-- F-12: Insights
-- Sprint 18

-- CreateEnum
CREATE TYPE "InsightSeverity" AS ENUM ('positive', 'neutral', 'negative');

-- CreateTable: insights
CREATE TABLE "insights" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" VARCHAR(100) NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "InsightSeverity" NOT NULL DEFAULT 'neutral',
    "data" JSONB NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "seenAt" TIMESTAMP(3),
    "dismissedAt" TIMESTAMP(3),

    CONSTRAINT "insights_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "insights_userId_kind_key" ON "insights"("userId", "kind");
CREATE INDEX "insights_userId_dismissedAt_detectedAt_idx" ON "insights"("userId", "dismissedAt", "detectedAt" DESC);

-- AddForeignKey
ALTER TABLE "insights"
    ADD CONSTRAINT "insights_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
