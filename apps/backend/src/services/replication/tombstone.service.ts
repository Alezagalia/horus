/**
 * Tombstones de hard deletes para la replicación offline-first.
 * Solo Transaction hace hard delete hoy; los soft deletes (isActive=false)
 * viajan como `updated`, no generan tombstone.
 */

import { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../../lib/prisma.js';

/** Días que se retienen tombstones. Un cliente cuyo lastPulledAt sea más viejo
 * que esto debe hacer full-resync (ver guard del pull). */
export const TOMBSTONE_RETENTION_DAYS = 180;

/**
 * Registra tombstones de filas hard-deleteadas. Upsert por (tableName, rowId):
 * reintentos (retry de push, delete repetido desde web y mobile) no duplican
 * ni fallan. Debe llamarse con el MISMO cliente transaccional que ejecuta el
 * delete para que sea atómico.
 */
export async function recordTombstones(
  tx: Prisma.TransactionClient,
  userId: string,
  tableName: string,
  rowIds: string[]
): Promise<void> {
  for (const rowId of rowIds) {
    await tx.replicationTombstone.upsert({
      where: { tableName_rowId: { tableName, rowId } },
      update: {}, // ya registrado: conservar el deletedAt original
      create: { userId, tableName, rowId },
    });
  }
}

/** Purga tombstones más viejos que la retención. Corre en un cron diario. */
export async function purgeTombstones(
  retentionDays: number = TOMBSTONE_RETENTION_DAYS
): Promise<number> {
  const threshold = new Date();
  threshold.setDate(threshold.getDate() - retentionDays);

  const result = await prisma.replicationTombstone.deleteMany({
    where: { deletedAt: { lt: threshold } },
  });
  return result.count;
}
