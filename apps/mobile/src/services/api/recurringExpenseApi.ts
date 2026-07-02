// Offline-first Fase 1: las plantillas de gasto recurrente se leen/escriben en
// WatermelonDB (src/db/moneyQueries|moneyWrites) y se replican vía /api/replication.
// Este módulo conserva solo el re-export de tipos que consume la UI.

import type { RecurringExpense } from '@horus/shared';

export type { RecurringExpense };
