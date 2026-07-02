/**
 * Purge Tombstones Cron Job (offline-first Fase 1)
 *
 * Purga diariamente los tombstones de replicación más viejos que la retención
 * (180 días). Un cliente cuyo lastPulledAt sea anterior al horizonte recibe
 * `fullResyncRequired` en el pull, así que purgar no pierde deletes.
 *
 * Schedule: diario a las 03:45 (después del retention job de S-02.4).
 */

import cron from 'node-cron';
import { logger } from '../lib/logger.js';
import {
  purgeTombstones,
  TOMBSTONE_RETENTION_DAYS,
} from '../services/replication/tombstone.service.js';

export async function runPurgeTombstones(): Promise<number> {
  const purged = await purgeTombstones(TOMBSTONE_RETENTION_DAYS);
  if (purged > 0) {
    logger.info(
      `[Purge Tombstones Job] Purged ${purged} tombstones older than ${TOMBSTONE_RETENTION_DAYS} days`
    );
  }
  return purged;
}

export function schedulePurgeTombstonesJob(): cron.ScheduledTask {
  logger.info('[Purge Tombstones Job] Scheduling daily job at 03:45...');
  return cron.schedule('45 3 * * *', async () => {
    try {
      await runPurgeTombstones();
    } catch (error) {
      logger.error('[Purge Tombstones Job] Failed:', error);
    }
  });
}
