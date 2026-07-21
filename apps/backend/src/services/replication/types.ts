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

export type ResourceRaw = {
  id: string;
  category_id: string | null;
  type: string;
  title: string;
  description: string | null;
  content: string | null;
  url: string | null;
  language: string | null;
  /** JSON string (Prisma Json) — passthrough, la UI mobile no lo edita */
  metadata: string | null;
  /** JSON string de string[] — WMDB no tiene tipo array */
  tags: string;
  is_pinned: boolean;
  color: string | null;
  created_at: number;
  updated_at: number;
};

/** Macros como number (Prisma Decimal → Number()). Soft delete via is_active. */
export type FoodRaw = {
  id: string;
  name: string;
  brand: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number | null;
  unit: string;
  is_active: boolean;
  created_at: number;
  updated_at: number;
};

export type RecipeRaw = {
  id: string;
  name: string;
  description: string | null;
  servings: number;
  is_active: boolean;
  created_at: number;
  updated_at: number;
};

/** Sin userId propio: ownership vía su recipe. Hard delete con tombstones. */
export type RecipeIngredientRaw = {
  id: string;
  recipe_id: string;
  food_id: string;
  grams: number;
  notes: string | null;
  created_at: number;
  updated_at: number;
};

/** Upsert por (userId, weekStart) — colisión de ids se fusiona (ver handler). */
export type MealPlanRaw = {
  id: string;
  /** Medianoche UTC del lunes de la semana (ms). */
  week_start: number;
  notes: string | null;
  created_at: number;
  updated_at: number;
};

export type MealEntryRaw = {
  id: string;
  meal_plan_id: string;
  /** Fecha del día (ms, medianoche UTC). */
  day: number;
  meal_time: string;
  notes: string | null;
  created_at: number;
  updated_at: number;
};

export type MealEntryItemRaw = {
  id: string;
  meal_entry_id: string;
  food_id: string | null;
  recipe_id: string | null;
  grams: number;
  servings: number | null;
  created_at: number;
  updated_at: number;
};

/** Upsert por (userId, date) — colisión de ids se fusiona (ver handler). */
export type NutritionLogRaw = {
  id: string;
  /** Fecha del día (ms, medianoche UTC). */
  date: number;
  notes: string | null;
  created_at: number;
  updated_at: number;
};

export type NutritionLogItemRaw = {
  id: string;
  nutrition_log_id: string;
  food_id: string | null;
  meal_time: string;
  grams: number;
  servings: number | null;
  notes: string | null;
  created_at: number;
  updated_at: number;
};

/** Hard delete con tombstones (sin isActive en Prisma). */
export type ShoppingListRaw = {
  id: string;
  meal_plan_id: string | null;
  name: string;
  transaction_id: string | null;
  generated_at: number | null;
  created_at: number;
  updated_at: number;
};

export type ShoppingListItemRaw = {
  id: string;
  shopping_list_id: string;
  food_id: string | null;
  name: string;
  quantity: number;
  unit: string;
  checked: boolean;
  notes: string | null;
  created_at: number;
  updated_at: number;
};

/** Hard delete con tombstones; el delete se salta si el ejercicio está
 * referenciado por rutinas/workouts (FK Restrict, igual que el REST). */
export type ExerciseRaw = {
  id: string;
  name: string;
  muscle_group: string | null;
  notes: string | null;
  created_at: number;
  updated_at: number;
};

export type RoutineRaw = {
  id: string;
  name: string;
  description: string | null;
  created_at: number;
  updated_at: number;
};

export type RoutineExerciseRaw = {
  id: string;
  routine_id: string;
  exercise_id: string;
  /** `order` en Prisma; renombrado porque ORDER es keyword SQL. */
  sort_order: number;
  target_sets: number | null;
  target_reps: number | null;
  target_weight: number | null;
  rest_time: number | null;
  notes: string | null;
  created_at: number;
  updated_at: number;
};

export type WorkoutRaw = {
  id: string;
  routine_id: string | null;
  start_time: number;
  /** null = entrenamiento en progreso. */
  end_time: number | null;
  notes: string | null;
  created_at: number;
  updated_at: number;
};

export type WorkoutExerciseRaw = {
  id: string;
  workout_id: string;
  exercise_id: string;
  /** `order` en Prisma; renombrado porque ORDER es keyword SQL. */
  sort_order: number;
  notes: string | null;
  rpe: number | null;
  created_at: number;
  updated_at: number;
};

export type WorkoutSetRaw = {
  id: string;
  workout_exercise_id: string;
  set_number: number;
  reps: number;
  weight: number;
  weight_unit: string;
  completed: boolean;
  rest_time: number | null;
  notes: string | null;
  /** Momento en que se completó la serie (ms). */
  timestamp: number;
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
  'resources',
  'foods',
  'recipes',
  'recipe_ingredients',
  'meal_plans',
  'meal_entries',
  'meal_entry_items',
  'nutrition_logs',
  'nutrition_log_items',
  'shopping_lists',
  'shopping_list_items',
  'exercises',
  'routines',
  'routine_exercises',
  'workouts',
  'workout_exercises',
  'workout_sets',
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
  resources?: TableChanges<ResourceRaw>;
  foods?: TableChanges<FoodRaw>;
  recipes?: TableChanges<RecipeRaw>;
  recipe_ingredients?: TableChanges<RecipeIngredientRaw>;
  meal_plans?: TableChanges<MealPlanRaw>;
  meal_entries?: TableChanges<MealEntryRaw>;
  meal_entry_items?: TableChanges<MealEntryItemRaw>;
  nutrition_logs?: TableChanges<NutritionLogRaw>;
  nutrition_log_items?: TableChanges<NutritionLogItemRaw>;
  shopping_lists?: TableChanges<ShoppingListRaw>;
  shopping_list_items?: TableChanges<ShoppingListItemRaw>;
  exercises?: TableChanges<ExerciseRaw>;
  routines?: TableChanges<RoutineRaw>;
  routine_exercises?: TableChanges<RoutineExerciseRaw>;
  workouts?: TableChanges<WorkoutRaw>;
  workout_exercises?: TableChanges<WorkoutExerciseRaw>;
  workout_sets?: TableChanges<WorkoutSetRaw>;
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
