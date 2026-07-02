import { appSchema, tableSchema } from '@nozbe/watermelondb';

/**
 * Schema local (SQLite) del dominio Dinero — offline-first Fase 1.
 * Columnas en snake_case, espejo exacto de los `Raw` del backend
 * (`apps/backend/src/services/replication/types.ts`). Timestamps en ms.
 *
 * v2: reemplaza el schema del spike (solo accounts). Sin datos reales que
 * migrar → bump de versión sin migrations (reset local).
 */
export const schema = appSchema({
  version: 2,
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
  ],
});
