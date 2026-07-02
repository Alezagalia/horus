// Offline-first Fase 1: los presupuestos se leen/escriben en WatermelonDB
// (src/db/moneyQueries|moneyWrites) y se replican vía /api/replication.
// Este módulo conserva solo el re-export de tipos que consume la UI.

import type { Budget, BudgetSummary } from '@horus/shared';

export type { Budget, BudgetSummary };
