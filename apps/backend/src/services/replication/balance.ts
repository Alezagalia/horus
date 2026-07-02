/**
 * Deltas de saldo — espejo exacto de la lógica de `transaction.service.ts`
 * (create/update/delete ajustan Account.currentBalance). Se mantienen como
 * helpers puros para que el push de replicación y los tests compartan la
 * misma aritmética que la API REST.
 */

/** Redondeo a 2 decimales: los montos viajan como number JS pero la columna es Decimal(15,2). */
export function round2(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/** Impacto de una transacción sobre el saldo de su cuenta: +ingreso / -egreso. */
export function txDelta(type: string, amount: number): number {
  return round2(type === 'ingreso' ? amount : -amount);
}

/** Delta que revierte el impacto de una transacción existente. */
export function revertDelta(type: string, amount: number): number {
  return round2(-txDelta(type, amount));
}
