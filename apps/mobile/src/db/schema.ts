import { appSchema, tableSchema } from '@nozbe/watermelondb';

// Spike Fase 0: sólo `accounts`. Columnas en snake_case (convención Watermelon).
export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'accounts',
      columns: [
        { name: 'server_id', type: 'string', isOptional: true },
        { name: 'name', type: 'string' },
        { name: 'type', type: 'string' },
        { name: 'currency', type: 'string' },
        { name: 'balance', type: 'number' },
        { name: 'color', type: 'string', isOptional: true },
        { name: 'is_active', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ],
});
