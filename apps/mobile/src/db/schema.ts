import { appSchema, tableSchema } from '@nozbe/watermelondb';

/**
 * Schema local (SQLite) — offline-first. Columnas en snake_case, espejo exacto
 * de los `Raw` del backend (`apps/backend/src/services/replication/types.ts`).
 * Timestamps en ms.
 *
 * v2: dominio Dinero (Fase 1); reemplazó el schema del spike sin migrations.
 * v3: + habits y habit_records (Fase 2) — CON migración (migrations.ts) para
 *     preservar los datos de Dinero ya sincronizados.
 */
export const schema = appSchema({
  version: 3,
  tables: [
    tableSchema({
      name: 'accounts',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'type', type: 'string' },
        { name: 'currency', type: 'string' },
        // currentBalance del server; el cliente lo ajusta de forma optimista y
        // el pull lo corrige (read-only en el push salvo el inicial del create)
        { name: 'balance', type: 'number' },
        // editable: cambiarlo desplaza el balance por la diferencia (server-side)
        { name: 'initial_balance', type: 'number' },
        { name: 'color', type: 'string', isOptional: true },
        { name: 'icon', type: 'string', isOptional: true },
        { name: 'is_active', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'categories',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'scope', type: 'string' },
        { name: 'icon', type: 'string', isOptional: true },
        { name: 'color', type: 'string', isOptional: true },
        { name: 'is_default', type: 'boolean' },
        { name: 'is_active', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'transactions',
      columns: [
        { name: 'account_id', type: 'string', isIndexed: true },
        { name: 'category_id', type: 'string', isIndexed: true },
        { name: 'type', type: 'string' },
        { name: 'amount', type: 'number' },
        { name: 'concept', type: 'string' },
        { name: 'date', type: 'number', isIndexed: true },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'is_transfer', type: 'boolean' },
        { name: 'target_account_id', type: 'string', isOptional: true },
        { name: 'transfer_pair_id', type: 'string', isOptional: true },
        { name: 'monthly_expense_instance_id', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'recurring_expenses',
      columns: [
        { name: 'concept', type: 'string' },
        { name: 'category_id', type: 'string' },
        { name: 'currency', type: 'string' },
        { name: 'due_day', type: 'number', isOptional: true },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'is_active', type: 'boolean' },
        { name: 'last_reviewed_at', type: 'number' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'monthly_expense_instances',
      columns: [
        { name: 'recurring_expense_id', type: 'string', isIndexed: true },
        { name: 'month', type: 'number' },
        { name: 'year', type: 'number' },
        { name: 'concept', type: 'string' },
        { name: 'category_id', type: 'string' },
        { name: 'amount', type: 'number' },
        { name: 'previous_amount', type: 'number', isOptional: true },
        { name: 'account_id', type: 'string', isOptional: true },
        { name: 'paid_date', type: 'number', isOptional: true },
        { name: 'status', type: 'string' },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'budgets',
      columns: [
        { name: 'category_id', type: 'string' },
        { name: 'amount', type: 'number' },
        { name: 'currency', type: 'string' },
        { name: 'is_active', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'savings_goals',
      columns: [
        { name: 'account_id', type: 'string' },
        { name: 'name', type: 'string' },
        { name: 'target_amount', type: 'number' },
        { name: 'target_date', type: 'number', isOptional: true },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'status', type: 'string' },
        { name: 'is_active', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'habits',
      columns: [
        { name: 'category_id', type: 'string' },
        { name: 'name', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'type', type: 'string' }, // CHECK | NUMERIC
        { name: 'target_value', type: 'number', isOptional: true },
        { name: 'unit', type: 'string', isOptional: true },
        { name: 'periodicity', type: 'string' }, // DAILY | WEEKLY | MONTHLY | CUSTOM
        // JSON string de number[] (Watermelon no tiene columnas array)
        { name: 'week_days', type: 'string' },
        { name: 'time_of_day', type: 'string' },
        { name: 'reminder_time', type: 'string', isOptional: true },
        { name: 'color', type: 'string', isOptional: true },
        // `order` en Prisma; renombrado porque ORDER es keyword SQL
        { name: 'sort_order', type: 'number' },
        { name: 'is_active', type: 'boolean' },
        // Derivados del server (recalculados desde los records en cada push);
        // el cliente los ajusta de forma optimista y el pull los corrige.
        { name: 'current_streak', type: 'number' },
        { name: 'longest_streak', type: 'number' },
        { name: 'last_completed_date', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'habit_records',
      columns: [
        { name: 'habit_id', type: 'string', isIndexed: true },
        // Fecha del registro normalizada a mediodía UTC (ms) — igualdad exacta
        { name: 'date', type: 'number', isIndexed: true },
        { name: 'completed', type: 'boolean' },
        { name: 'value', type: 'number', isOptional: true },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ],
});
