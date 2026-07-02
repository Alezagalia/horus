-- Offline-first Fase 1 (dominio Dinero)
-- 1) Tombstones de hard deletes para la replicación WatermelonDB.
-- 2) Vínculo explícito transacción <-> instancia de gasto mensual (reemplaza la
--    heurística por concepto al pagar/deshacer).

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN "monthlyExpenseInstanceId" TEXT;

-- CreateIndex
CREATE INDEX "transactions_monthlyExpenseInstanceId_idx" ON "transactions"("monthlyExpenseInstanceId");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_monthlyExpenseInstanceId_fkey" FOREIGN KEY ("monthlyExpenseInstanceId") REFERENCES "monthly_expense_instances"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "replication_tombstones" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tableName" VARCHAR(50) NOT NULL,
    "rowId" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "replication_tombstones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "replication_tombstones_tableName_rowId_key" ON "replication_tombstones"("tableName", "rowId");

-- CreateIndex
CREATE INDEX "replication_tombstones_userId_deletedAt_idx" ON "replication_tombstones"("userId", "deletedAt");

-- AddForeignKey
ALTER TABLE "replication_tombstones" ADD CONSTRAINT "replication_tombstones_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
