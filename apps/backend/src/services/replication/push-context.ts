/**
 * Contexto compartido de un push de replicación: el cliente transaccional de
 * Prisma, el usuario y el estado que los handlers de tabla necesitan coordinar
 * (pagos cuyo claim se perdió, patas de transferencia ya procesadas).
 */

import { Prisma } from '../../generated/prisma/client.js';
import { logger } from '../../lib/logger.js';

export interface PushContext {
  tx: Prisma.TransactionClient;
  userId: string;
  /** lastPulledAt del cliente (ms). Solo para detección/log de conflictos. */
  lastPulledAt: number;
  /** Instancias de gasto mensual cuyo claim de pago se perdió (ya estaban
   * pagadas en el server): la transaction entrante asociada se descarta. */
  skippedInstanceIds: Set<string>;
  /** Ids de transacciones de transferencia ya procesadas en este push
   * (evita aplicar el delta dos veces cuando llegan ambas patas). */
  processedTransferIds: Set<string>;
}

export function createPushContext(
  tx: Prisma.TransactionClient,
  userId: string,
  lastPulledAt: number
): PushContext {
  return {
    tx,
    userId,
    lastPulledAt,
    skippedInstanceIds: new Set(),
    processedTransferIds: new Set(),
  };
}

/**
 * Conflicto estándar Watermelon: la fila cambió en el server después del último
 * pull del cliente. Fase 1 = LWW client-wins (con "deleted gana" y "claim gana"
 * como excepciones), así que esto solo se loguea para medir si ocurre.
 */
export function logIfConflict(
  ctx: PushContext,
  tableName: string,
  rowId: string,
  serverUpdatedAt: Date
): void {
  if (ctx.lastPulledAt > 0 && serverUpdatedAt.getTime() > ctx.lastPulledAt) {
    logger.warn(
      `[replication] conflicto LWW en ${tableName}/${rowId}: server updatedAt=${serverUpdatedAt.toISOString()} > lastPulledAt=${new Date(ctx.lastPulledAt).toISOString()} (gana el cliente)`
    );
  }
}
