// Offline-first Fase 1: los gastos mensuales se leen/escriben en WatermelonDB
// (src/db/moneyQueries|moneyWrites: listMonthlyExpensesLocal, payMonthlyExpenseLocal,
// undoMonthlyExpensePaymentLocal) y se replican vía /api/replication.
// Este módulo conserva solo el re-export de tipos que consume la UI.

import type { MonthlyExpense } from '@horus/shared';

export type { MonthlyExpense };
