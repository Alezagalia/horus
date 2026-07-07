import { schemaMigrations, createTable } from '@nozbe/watermelondb/Schema/migrations';

/**
 * Migraciones del schema local. A partir de v2 (Fase 1 en producción) los
 * bumps de versión DEBEN migrar en lugar de resetear: la DB local puede tener
 * escrituras offline sin pushear que un reset perdería.
 *
 * Nota sync: `synchronize({ migrationsEnabledAtVersion: 2 })` detecta las
 * tablas nuevas de una migración y las pide completas al pull (fullTables),
 * porque el pull incremental con lastPulledAt viejo jamás traería sus filas
 * históricas.
 */
export const migrations = schemaMigrations({
  migrations: [
    {
      // v3 — Fase 2 Hábitos
      toVersion: 3,
      steps: [
        createTable({
          name: 'habits',
          columns: [
            { name: 'category_id', type: 'string' },
            { name: 'name', type: 'string' },
            { name: 'description', type: 'string', isOptional: true },
            { name: 'type', type: 'string' },
            { name: 'target_value', type: 'number', isOptional: true },
            { name: 'unit', type: 'string', isOptional: true },
            { name: 'periodicity', type: 'string' },
            { name: 'week_days', type: 'string' },
            { name: 'time_of_day', type: 'string' },
            { name: 'reminder_time', type: 'string', isOptional: true },
            { name: 'color', type: 'string', isOptional: true },
            { name: 'sort_order', type: 'number' },
            { name: 'is_active', type: 'boolean' },
            { name: 'current_streak', type: 'number' },
            { name: 'longest_streak', type: 'number' },
            { name: 'last_completed_date', type: 'number', isOptional: true },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
          ],
        }),
        createTable({
          name: 'habit_records',
          columns: [
            { name: 'habit_id', type: 'string', isIndexed: true },
            { name: 'date', type: 'number', isIndexed: true },
            { name: 'completed', type: 'boolean' },
            { name: 'value', type: 'number', isOptional: true },
            { name: 'notes', type: 'string', isOptional: true },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
          ],
        }),
      ],
    },
  ],
});
