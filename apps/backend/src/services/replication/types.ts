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

export type HabitRaw = {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  type: string;
  target_value: number | null;
  unit: string | null;
  periodicity: string;
  /** JSON string de number[] (Watermelon no tiene columnas array). */
  week_days: string;
  time_of_day: string;
  reminder_time: string | null;
  color: string | null;
  /** `order` en Prisma; renombrado porque ORDER es keyword SQL. */
  sort_order: number;
  is_active: boolean;
  /** Derivados del server (recalculados desde los records). READ-ONLY en el push. */
  current_streak: number;
  longest_streak: number;
  last_completed_date: number | null;
  created_at: number;
  updated_at: number;
};

export type HabitRecordRaw = {
  id: string;
  habit_id: string;
  /** Fecha del registro normalizada a mediodía UTC (ms). */
  date: number;
  completed: boolean;
  value: number | null;
  notes: string | null;
  created_at: number;
  updated_at: number;
};

export type TaskRaw = {
  id: string;
  category_id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  due_date: number | null;
  completed_at: number | null;
  canceled_at: number | null;
  archived_at: number | null;
  cancel_reason: string | null;
  is_active: boolean;
  order_position: number;
  reschedule_count: number;
  created_at: number;
  updated_at: number;
};

export type TaskChecklistItemRaw = {
  id: string;
  task_id: string;
  title: string;
  completed: boolean;
  position: number;
  created_at: number;
  updated_at: number;
};

export type GoalRaw = {
  id: string;
  category_id: string | null;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  target_date: number | null;
  completed_at: number | null;
  is_active: boolean;
  is_featured: boolean;
  created_at: number;
  updated_at: number;
};

export type KeyResultRaw = {
  id: string;
  goal_id: string;
  title: string;
  target_value: number;
  /** Lo incrementan los hábitos vinculados (server-side) y también es editable
   * a mano: LWW client-wins — una edición offline puede pisar un incremento
   * concurrente (raro; se loguea como conflicto). */
  current_value: number;
  unit: string | null;
  is_active: boolean;
  created_at: number;
  updated_at: number;
};

/** Sin updated_at en Prisma: se pullean COMPLETOS en cada pull (pocas filas)
 * y los unlinks viajan como tombstones. */
export type GoalHabitRaw = {
  id: string;
  goal_id: string;
  habit_id: string;
  kr_id: string | null;
  created_at: number;
};

export type GoalTaskRaw = {
  id: string;
  goal_id: string;
  task_id: string;
  created_at: number;
};

/** Sin los campos de Google/notificaciones (server-only: googleEventId,
 * syncWithGoogle, syncRetry*, notificationSent, rrule). El cliente solo crea
 * eventos SIMPLES; los recurrentes y sus instancias llegan por pull. */
export type EventRaw = {
  id: string;
  category_id: string;
  title: string;
  description: string | null;
  location: string | null;
  start_date_time: number;
  end_date_time: number;
  is_all_day: boolean;
  is_recurring: boolean;
  recurring_event_id: string | null;
  status: string;
  completed_at: number | null;
  canceled_at: number | null;
  archived_at: number | null;
  reminder_minutes: number | null;
  created_at: number;
  updated_at: number;
};

export interface TableChanges<Raw> {
  created?: Raw[];
  updated?: Raw[];
  deleted?: string[];
}

/** Nombres de tabla Watermelon replicados (Fase 1: Dinero; Fase 2: Hábitos). */
export const REPLICATED_TABLES = [
  'accounts',
  'categories',
  'transactions',
  'recurring_expenses',
  'monthly_expense_instances',
  'budgets',
  'savings_goals',
  'habits',
  'habit_records',
  'tasks',
  'task_checklist_items',
  'goals',
  'key_results',
  'goal_habits',
  'goal_tasks',
  'events',
] as const;

export type ReplicatedTable = (typeof REPLICATED_TABLES)[number];

export interface PushChanges {
  accounts?: TableChanges<AccountRaw>;
  categories?: TableChanges<CategoryRaw>;
  transactions?: TableChanges<TransactionRaw>;
  recurring_expenses?: TableChanges<RecurringExpenseRaw>;
  monthly_expense_instances?: TableChanges<MonthlyExpenseInstanceRaw>;
  budgets?: TableChanges<BudgetRaw>;
  savings_goals?: TableChanges<SavingsGoalRaw>;
  habits?: TableChanges<HabitRaw>;
  habit_records?: TableChanges<HabitRecordRaw>;
  tasks?: TableChanges<TaskRaw>;
  task_checklist_items?: TableChanges<TaskChecklistItemRaw>;
  goals?: TableChanges<GoalRaw>;
  key_results?: TableChanges<KeyResultRaw>;
  goal_habits?: TableChanges<GoalHabitRaw>;
  goal_tasks?: TableChanges<GoalTaskRaw>;
  events?: TableChanges<EventRaw>;
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
