import { synchronize } from '@nozbe/watermelondb/sync';
import { database } from './index';
import { axiosInstance } from '@/services/axios';

/**
 * Sincroniza la DB local (WatermelonDB) con el backend vía `/api/replication`.
 * pull: baja cambios desde lastPulledAt. push: sube los cambios locales (idempotente
 * por id en el server). Fase 0: sólo `accounts`.
 */
export async function syncOffline(): Promise<void> {
  await synchronize({
    database,
    pullChanges: async ({ lastPulledAt }) => {
      const { data } = await axiosInstance.get('/replication/pull', {
        params: { lastPulledAt: lastPulledAt ?? 0 },
      });
      return { changes: data.changes, timestamp: data.timestamp };
    },
    pushChanges: async ({ changes }) => {
      await axiosInstance.post('/replication/push', { changes });
    },
  });
}
