import { synchronize, hasUnsyncedChanges } from '@nozbe/watermelondb/sync';
import { database } from './index';
import { axiosInstance } from '@/services/axios';

/** El server purgó tombstones más viejos que el lastPulledAt del cliente:
 * hay que resetear la copia local y pullear desde cero. */
class FullResyncRequiredError extends Error {
  constructor() {
    super('full-resync-required');
    this.name = 'FullResyncRequiredError';
  }
}

async function runSynchronize(): Promise<void> {
  await synchronize({
    database,
    // Desde qué versión de schema el sync soporta migraciones: al migrar (p.ej.
    // v2→v3 agrega habits/habit_records), Watermelon manda `migration.tables`
    // con las tablas nuevas y el pull las pide COMPLETAS (fullTables), porque
    // el pull incremental con lastPulledAt viejo no traería sus filas.
    migrationsEnabledAtVersion: 2,
    pullChanges: async ({ lastPulledAt, migration }) => {
      // `categories` va SIEMPRE en el fullTables de una migración: las fases
      // nuevas suman scopes de categorías a la replicación (habitos, tareas) y
      // esas filas viejas jamás vendrían en el pull incremental — la tabla no
      // es "nueva" para Watermelon, así que migration.tables no la incluye.
      const fullTables = migration?.tables?.length
        ? [...migration.tables, 'categories'].join(',')
        : undefined;
      const { data } = await axiosInstance.get('/replication/pull', {
        params: { lastPulledAt: lastPulledAt ?? 0, ...(fullTables ? { fullTables } : {}) },
      });
      if (data.fullResyncRequired) throw new FullResyncRequiredError();
      return { changes: data.changes, timestamp: data.timestamp };
    },
    pushChanges: async ({ changes, lastPulledAt }) => {
      // lastPulledAt viaja para la detección/log de conflictos del server
      await axiosInstance.post('/replication/push', { changes, lastPulledAt });
    },
  });
}

/**
 * Sincroniza la DB local con `/api/replication` (pull + push, idempotente por
 * id). Si el server pide full-resync, resetea la DB local y re-sincroniza
 * desde cero — SOLO si no hay cambios locales pendientes (no perder escrituras
 * offline; en ese caso el próximo sync reintenta).
 */
export async function syncOffline(): Promise<void> {
  try {
    await runSynchronize();
  } catch (error) {
    if (!(error instanceof FullResyncRequiredError)) throw error;

    const pending = await hasUnsyncedChanges({ database });
    if (pending) {
      throw new Error(
        'El server pide resync completo pero hay cambios locales sin subir; se reintenta en el próximo sync'
      );
    }
    await database.write(async () => {
      await database.unsafeResetDatabase();
    });
    await runSynchronize();
  }
}

/** ¿Hay escrituras locales que todavía no llegaron al server? */
export async function hasPendingChanges(): Promise<boolean> {
  return hasUnsyncedChanges({ database });
}
