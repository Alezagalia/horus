-- CreateTable
CREATE TABLE "habit_records" (
    "id" TEXT NOT NULL,
    "habitId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "value" DOUBLE PRECISION,
    "notes" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "habit_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "habit_records_userId_date_idx" ON "habit_records"("userId", "date");

-- CreateIndex
CREATE INDEX "habit_records_habitId_date_idx" ON "habit_records"("habitId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "habit_records_habitId_userId_date_key" ON "habit_records"("habitId", "userId", "date");

-- AddForeignKey
ALTER TABLE "habit_records" ADD CONSTRAINT "habit_records_habitId_fkey" FOREIGN KEY ("habitId") REFERENCES "habits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habit_records" ADD CONSTRAINT "habit_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
