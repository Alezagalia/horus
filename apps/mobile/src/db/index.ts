import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { schema } from './schema';
import { Account } from './models/Account';

const adapter = new SQLiteAdapter({
  schema,
  // jsi: true usa el adapter JSI nativo (rápido, síncrono). Es lo que valida el spike
  // (que el módulo nativo cargue con New Arch OFF / Paper).
  jsi: true,
  onSetUpError: (error) => {
    // eslint-disable-next-line no-console
    console.error('[WatermelonDB] setup error', error);
  },
});

export const database = new Database({
  adapter,
  modelClasses: [Account],
});
