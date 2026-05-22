/**
 * Life Debt Types
 * F-14 - Deuda de Vida
 * Sprint 17
 */

export type LifeDebtItemType = 'task' | 'habit' | 'recurring_expense';

export type LifeDebtDecisionKind = 'commit' | 'delegate' | 'delete';

export interface LifeDebtItem {
  type: LifeDebtItemType;
  id: string;
  title: string;
  reason: string; // texto explicativo: por qué entró a la deuda
  agingDays: number; // antigüedad del problema en días
  metadata: {
    rescheduleCount?: number; // tareas
    daysSinceLastCompletion?: number; // hábitos
    daysSinceLastReview?: number; // gastos recurrentes
    currentDueDate?: string | null; // tareas
    streakBeforeBreak?: number; // hábitos
  };
}

export interface LifeDebtResponse {
  items: LifeDebtItem[];
  totals: {
    tasks: number;
    habits: number;
    recurringExpenses: number;
    all: number;
  };
}

export interface LifeDebtDecisionRequest {
  itemType: LifeDebtItemType;
  itemId: string;
  decision: LifeDebtDecisionKind;
  commitDate?: string; // YYYY-MM-DD; requerido si decision = commit
  reason?: string;
}

export interface LifeDebtDecisionResponse {
  id: string;
  itemType: LifeDebtItemType;
  itemId: string;
  decision: LifeDebtDecisionKind;
  commitDate: string | null;
  reason: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

export const LIFE_DEBT_ITEM_TYPES: readonly LifeDebtItemType[] = [
  'task',
  'habit',
  'recurring_expense',
] as const;

export const LIFE_DEBT_DECISION_KINDS: readonly LifeDebtDecisionKind[] = [
  'commit',
  'delegate',
  'delete',
] as const;
