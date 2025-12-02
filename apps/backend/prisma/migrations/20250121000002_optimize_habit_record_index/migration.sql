-- US-035: Optimización de Queries para Cálculo de Rachas
-- Drop existing index and create optimized index with DESC ordering

-- Drop old index (habitId, date)
DROP INDEX IF EXISTS "habit_records_habitId_date_idx";

-- Create optimized index with DESC ordering for efficient streak queries
-- This allows quick retrieval of recent records for streak calculation
CREATE INDEX "habit_records_habitId_date_idx" ON "habit_records"("habitId", "date" DESC);
