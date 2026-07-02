/**
 * Tipos del protocolo de replicación offline-first (WatermelonDB `synchronize()`).
 * Convención Watermelon: columnas snake_case, timestamps en MILISEGUNDOS,
 * changes = { <tabla>: { created[], updated[], deleted[ids] } }.
 */

export type AccountRaw = {
  id: string;
  name: string;
  type: string;
  currency: string;
  /** currentBalance del server. READ-ONLY para el cliente salvo en created (balance inicial). */
  balance: number;
  /** Editable: cambiarlo desplaza currentBalance por la diferencia (como el PUT REST). */
  initial_balance: number;
  color: string | null;
  icon: string | null;
  is_active: boolean;
  created_at: number;
  updated_at: number;
};

export type CategoryRaw = {
  id: string;
  name: string;
  scope: string;
  icon: string | null;
  color: string | null;
  is_default: boolean;
  is_active: boolean;
  created_at: number;
  updated_at: number;
};

export type TransactionRaw = {
  id: string;
  account_id: string;
  category_id: string;
  type: string;
  amount: number;
  concept: string;
  date: number;
  notes: string | null;
  is_transfer: boolean;
  target_account_id: string | null;
  transfer_pair_id: string | null;
  monthly_expense_instance_id: string | null;
  created_at: number;
  updated_at: number;
};

export type RecurringExpenseRaw = {
  id: string;
  concept: string;
  category_id: string;
  currency: string;
  due_day: number | null;
  notes: string | null;
  is_active: boolean;
  last_reviewed_at: number;
  created_at: number;
  updated_at: number;
};

export type MonthlyExpenseInstanceRaw = {
  id: string;
  recurring_expense_id: string;
  month: number;
  year: number;
  concept: string;
  category_id: string;
  amount: number;
  previous_amount: number | null;
  account_id: string | null;
  paid_date: number | null;
  status: string;
  notes: string | null;
  created_at: number;
  updated_at: number;
};

export type BudgetRaw = {
  id: string;
  category_id: string;
  amount: number;
  currency: string;
  is_active: boolean;
  created_at: number;
  updated_at: number;
};

export type SavingsGoalRaw = {
  id: string;
  account_id: string;
  name: string;
  target_amount: number;
  target_date: number | null;
  notes: string | null;
  status: string;
  is_active: boolean;
  created_at: number;
  updated_at: number;
};

export interface TableChanges<Raw> {
  created?: Raw[];
  updated?: Raw[];
  deleted?: string[];
}

/** Nombres de tabla Watermelon del dominio Dinero. */
export const MONEY_TABLES = [
  'accounts',
  'categories',
  'transactions',
  'recurring_expenses',
  'monthly_expense_instances',
  'budgets',
  'savings_goals',
] as const;

export type MoneyTable = (typeof MONEY_TABLES)[number];

export interface PushChanges {
  accounts?: TableChanges<AccountRaw>;
  categories?: TableChanges<CategoryRaw>;
  transactions?: TableChanges<TransactionRaw>;
  recurring_expenses?: TableChanges<RecurringExpenseRaw>;
  monthly_expense_instances?: TableChanges<MonthlyExpenseInstanceRaw>;
  budgets?: TableChanges<BudgetRaw>;
  savings_goals?: TableChanges<SavingsGoalRaw>;
}

export interface PullResult {
  changes: Record<string, TableChanges<unknown>>;
  timestamp: number;
}

/** El cliente debe resetear su DB local y pullear desde 0 (lastPulledAt anterior
 * al horizonte de retención de tombstones). */
export interface FullResyncResult {
  fullResyncRequired: true;
  timestamp: number;
}
