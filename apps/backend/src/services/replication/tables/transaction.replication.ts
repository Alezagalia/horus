import { Scope, Transaction, TransactionType } from '../../../generated/prisma/client.js';
import { BadRequestError } from '../../../middlewares/error.middleware.js';
import { logger } from '../../../lib/logger.js';
import { revertDelta, round2, txDelta } from '../balance.js';
import { PushContext, logIfConflict } from '../push-context.js';
import { recordTombstones } from '../tombstone.service.js';
import { TransactionRaw } from '../types.js';

export function toRaw(t: Transaction): TransactionRaw {
  return {
    id: t.id,
    account_id: t.accountId,
    category_id: t.categoryId,
    type: t.type,
    amount: Number(t.amount),
    concept: t.concept,
    date: t.date.getTime(),
    notes: t.notes,
    is_transfer: t.isTransfer,
    target_account_id: t.targetAccountId,
    transfer_pair_id: t.transferPairId,
    monthly_expense_instance_id: t.monthlyExpenseInstanceId,
    created_at: t.createdAt.getTime(),
    updated_at: t.updatedAt.getTime(),
  };
}

async function incrementBalance(ctx: PushContext, accountId: string, delta: number): Promise<void> {
  if (delta === 0) return;
  await ctx.tx.account.update({
    where: { id: accountId },
    data: { currentBalance: { increment: round2(delta) } },
  });
}

async function accountOfUser(ctx: PushContext, accountId: string | null) {
  if (!accountId) return null;
  const account = await ctx.tx.account.findUnique({ where: { id: accountId } });
  return account && account.userId === ctx.userId ? account : null;
}

async function categoryOfUser(ctx: PushContext, categoryId: string) {
  const category = await ctx.tx.category.findUnique({ where: { id: categoryId } });
  return category && category.userId === ctx.userId ? category : null;
}

async function hasTombstone(ctx: PushContext, id: string): Promise<boolean> {
  const tomb = await ctx.tx.replicationTombstone.findUnique({
    where: { tableName_rowId: { tableName: 'transactions', rowId: id } },
  });
  return tomb !== null;
}

/** Misma categoría interna que usa `transactionService.createTransfer`. */
async function resolveTransferCategory(ctx: PushContext): Promise<string> {
  const existing = await ctx.tx.category.findFirst({
    where: { userId: ctx.userId, name: 'Transferencias', scope: Scope.egresos },
  });
  if (existing) return existing.id;
  const created = await ctx.tx.category.create({
    data: {
      userId: ctx.userId,
      name: 'Transferencias',
      icon: 'swap-horizontal',
      color: '#6B7280',
      scope: Scope.egresos,
      isDefault: false,
    },
  });
  return created.id;
}

// ---------------------------------------------------------------------------
// DELETED — se aplica ANTES que created/updated (revertir saldos primero)
// ---------------------------------------------------------------------------

export async function applyDeleted(ctx: PushContext, ids: string[]): Promise<void> {
  for (const id of ids) {
    const existing = await ctx.tx.transaction.findUnique({ where: { id } });
    if (!existing) {
      // Ya borrada (retry, o la otra pata cayó al procesar la primera):
      // asegurar el tombstone igual, es idempotente.
      await recordTombstones(ctx.tx, ctx.userId, 'transactions', [id]);
      continue;
    }
    if (existing.userId !== ctx.userId) continue;

    await incrementBalance(
      ctx,
      existing.accountId,
      revertDelta(existing.type, Number(existing.amount))
    );

    // Transferencia: borrar también la pata pareada aunque el cliente no la liste
    // (espejo de transactionService.delete)
    if (existing.isTransfer && existing.transferPairId) {
      const pair = await ctx.tx.transaction.findUnique({ where: { id: existing.transferPairId } });
      if (pair) {
        await incrementBalance(ctx, pair.accountId, revertDelta(pair.type, Number(pair.amount)));
        await ctx.tx.transaction.delete({ where: { id: pair.id } });
        await recordTombstones(ctx.tx, ctx.userId, 'transactions', [pair.id]);
      }
    }

    await ctx.tx.transaction.delete({ where: { id } });
    await recordTombstones(ctx.tx, ctx.userId, 'transactions', [id]);
  }
}

// ---------------------------------------------------------------------------
// CREATED
// ---------------------------------------------------------------------------

export async function applyCreated(ctx: PushContext, raws: TransactionRaw[]): Promise<void> {
  const plain = raws.filter((r) => !r.is_transfer);
  const legs = raws.filter((r) => r.is_transfer);

  for (const raw of plain) {
    await createPlain(ctx, raw);
  }
  await createTransfers(ctx, legs);
}

async function createPlain(ctx: PushContext, raw: TransactionRaw): Promise<void> {
  const existing = await ctx.tx.transaction.findUnique({ where: { id: raw.id } });
  if (existing) return; // retry de push: no re-crear ni re-aplicar delta

  // Pago de gasto mensual: descartar si el claim se perdió o si la instancia
  // ya tiene una tx imputada (pagada por web antes del sync).
  if (raw.monthly_expense_instance_id) {
    if (ctx.skippedInstanceIds.has(raw.monthly_expense_instance_id)) return;
    const alreadyPaid = await ctx.tx.transaction.findFirst({
      where: { monthlyExpenseInstanceId: raw.monthly_expense_instance_id },
    });
    if (alreadyPaid) {
      logger.warn(
        `[replication] tx ${raw.id} descartada: la instancia ${raw.monthly_expense_instance_id} ya tiene pago imputado`
      );
      return;
    }
  }

  const account = await accountOfUser(ctx, raw.account_id);
  if (!account) {
    logger.warn(`[replication] tx ${raw.id} con cuenta ajena/inexistente: ignorada`);
    return;
  }
  const category = await categoryOfUser(ctx, raw.category_id);
  if (!category) {
    logger.warn(`[replication] tx ${raw.id} con categoría ajena/inexistente: ignorada`);
    return;
  }

  const amount = round2(raw.amount);
  await ctx.tx.transaction.create({
    data: {
      id: raw.id,
      userId: ctx.userId,
      accountId: raw.account_id,
      categoryId: raw.category_id,
      type: raw.type as TransactionType,
      amount,
      concept: raw.concept,
      date: new Date(raw.date),
      notes: raw.notes,
      monthlyExpenseInstanceId: raw.monthly_expense_instance_id,
    },
  });
  await incrementBalance(ctx, raw.account_id, txDelta(raw.type, amount));
}

/**
 * Transferencias creadas offline: el cliente genera 2 UUIDs y manda ambas patas
 * con transfer_pair_id cruzados. Se validan como par y se aplican los dos
 * deltas de saldo (espejo de transactionService.createTransfer, pero sin
 * validación de saldo suficiente — offline no se puede garantizar).
 */
async function createTransfers(ctx: PushContext, legs: TransactionRaw[]): Promise<void> {
  const byId = new Map(legs.map((l) => [l.id, l]));
  const done = new Set<string>();

  for (const leg of legs) {
    if (done.has(leg.id)) continue;
    done.add(leg.id);

    const existing = await ctx.tx.transaction.findUnique({ where: { id: leg.id } });
    if (existing) {
      if (leg.transfer_pair_id) done.add(leg.transfer_pair_id);
      continue; // retry: el par ya se aplicó atómicamente
    }

    const pairRaw = leg.transfer_pair_id ? byId.get(leg.transfer_pair_id) : undefined;

    if (!pairRaw) {
      // La pata pareada no vino en el batch: solo es válido si ya existe en el
      // server (estado raro pero recuperable). Si no, el push es inválido.
      const pairInDb = leg.transfer_pair_id
        ? await ctx.tx.transaction.findUnique({ where: { id: leg.transfer_pair_id } })
        : null;
      if (!pairInDb || pairInDb.userId !== ctx.userId) {
        throw new BadRequestError(`Transferencia incompleta: falta la pata pareada de ${leg.id}`);
      }
      const account = await accountOfUser(ctx, leg.account_id);
      if (!account) {
        logger.warn(`[replication] pata de transferencia ${leg.id} con cuenta inválida: ignorada`);
        continue;
      }
      const amount = round2(raw2Amount(pairInDb));
      await ctx.tx.transaction.create({
        data: {
          id: leg.id,
          userId: ctx.userId,
          accountId: leg.account_id,
          categoryId: pairInDb.categoryId,
          type: leg.type as TransactionType,
          amount,
          concept: pairInDb.concept,
          date: pairInDb.date,
          notes: pairInDb.notes,
          isTransfer: true,
          targetAccountId: pairInDb.accountId,
          transferPairId: pairInDb.id,
        },
      });
      await incrementBalance(ctx, leg.account_id, txDelta(leg.type, amount));
      continue;
    }

    done.add(pairRaw.id);
    validateTransferPair(leg, pairRaw);

    const [fromLeg, toLeg] = leg.type === 'egreso' ? [leg, pairRaw] : [pairRaw, leg];
    const fromAccount = await accountOfUser(ctx, fromLeg.account_id);
    const toAccount = await accountOfUser(ctx, toLeg.account_id);
    if (!fromAccount || !toAccount) {
      throw new BadRequestError(`Transferencia ${leg.id} con cuentas ajenas/inexistentes`);
    }
    if (fromAccount.currency !== toAccount.currency) {
      throw new BadRequestError(`Transferencia ${leg.id}: las cuentas deben tener la misma moneda`);
    }

    const categoryId = await resolveTransferCategory(ctx);
    const amount = round2(fromLeg.amount);
    const shared = {
      userId: ctx.userId,
      categoryId,
      amount,
      concept: fromLeg.concept,
      date: new Date(fromLeg.date),
      notes: fromLeg.notes,
      isTransfer: true,
    };

    await ctx.tx.transaction.create({
      data: {
        ...shared,
        id: fromLeg.id,
        accountId: fromLeg.account_id,
        type: 'egreso' as TransactionType,
        targetAccountId: toLeg.account_id,
        transferPairId: toLeg.id,
      },
    });
    await ctx.tx.transaction.create({
      data: {
        ...shared,
        id: toLeg.id,
        accountId: toLeg.account_id,
        type: 'ingreso' as TransactionType,
        targetAccountId: fromLeg.account_id,
        transferPairId: fromLeg.id,
      },
    });
    await incrementBalance(ctx, fromLeg.account_id, -amount);
    await incrementBalance(ctx, toLeg.account_id, amount);
  }
}

function raw2Amount(t: Transaction): number {
  return Number(t.amount);
}

function validateTransferPair(a: TransactionRaw, b: TransactionRaw): void {
  const fail = (reason: string): never => {
    throw new BadRequestError(`Transferencia inválida (${a.id}/${b.id}): ${reason}`);
  };
  if (b.transfer_pair_id !== a.id) fail('transfer_pair_id no cruzado');
  const types = [a.type, b.type].sort();
  if (types[0] !== 'egreso' || types[1] !== 'ingreso') fail('los tipos deben ser egreso+ingreso');
  if (round2(a.amount) !== round2(b.amount)) fail('montos distintos');
  if (a.account_id === b.account_id) fail('misma cuenta en ambas patas');
  if (a.target_account_id !== b.account_id || b.target_account_id !== a.account_id) {
    fail('target_account_id no cruzado');
  }
}

// ---------------------------------------------------------------------------
// UPDATED
// ---------------------------------------------------------------------------

export async function applyUpdated(ctx: PushContext, raws: TransactionRaw[]): Promise<void> {
  for (const raw of raws) {
    if (ctx.processedTransferIds.has(raw.id)) continue; // ya aplicada vía su pata pareada

    const existing = await ctx.tx.transaction.findUnique({ where: { id: raw.id } });
    if (!existing) {
      // "deleted gana": si hay tombstone, la fila fue borrada en otro device/web
      if (await hasTombstone(ctx, raw.id)) continue;
      // Watermelon puede degradar created→updated
      await applyCreated(ctx, [raw]);
      continue;
    }
    if (existing.userId !== ctx.userId) continue;
    logIfConflict(ctx, 'transactions', raw.id, existing.updatedAt);

    if (existing.isTransfer) {
      await updateTransferLeg(ctx, raw, existing);
    } else {
      await updatePlain(ctx, raw, existing);
    }
  }
}

async function updatePlain(
  ctx: PushContext,
  raw: TransactionRaw,
  existing: Transaction
): Promise<void> {
  // type es inmutable: cambiarlo rompería la aritmética del histórico de saldos
  if (raw.type !== existing.type) {
    logger.warn(`[replication] cambio de type ignorado en tx ${raw.id} (inmutable)`);
  }

  let accountId = raw.account_id;
  if (accountId !== existing.accountId && !(await accountOfUser(ctx, accountId))) {
    accountId = existing.accountId;
  }
  let categoryId = raw.category_id;
  if (categoryId !== existing.categoryId && !(await categoryOfUser(ctx, categoryId))) {
    categoryId = existing.categoryId;
  }

  const oldAmount = Number(existing.amount);
  const newAmount = round2(raw.amount);

  // Revertir el impacto viejo en la cuenta vieja y aplicar el nuevo en la nueva
  // (colapsa en un solo increment si la cuenta no cambió).
  if (accountId === existing.accountId) {
    await incrementBalance(
      ctx,
      existing.accountId,
      revertDelta(existing.type, oldAmount) + txDelta(existing.type, newAmount)
    );
  } else {
    await incrementBalance(ctx, existing.accountId, revertDelta(existing.type, oldAmount));
    await incrementBalance(ctx, accountId, txDelta(existing.type, newAmount));
  }

  await ctx.tx.transaction.update({
    where: { id: raw.id },
    data: {
      accountId,
      categoryId,
      amount: newAmount,
      concept: raw.concept,
      date: new Date(raw.date),
      notes: raw.notes,
    },
  });
}

/**
 * Update de una pata de transferencia: sincroniza monto/concepto/fecha/notas a
 * la pata pareada y ajusta ambos saldos (espejo de updateTransfer). Si el
 * cliente manda las dos patas en el mismo push, la segunda se saltea vía
 * processedTransferIds (sin delta doble).
 */
async function updateTransferLeg(
  ctx: PushContext,
  raw: TransactionRaw,
  existing: Transaction
): Promise<void> {
  ctx.processedTransferIds.add(existing.id);
  const pair = existing.transferPairId
    ? await ctx.tx.transaction.findUnique({ where: { id: existing.transferPairId } })
    : null;
  if (pair) ctx.processedTransferIds.add(pair.id);

  const oldAmount = Number(existing.amount);
  const newAmount = round2(raw.amount);

  if (newAmount !== oldAmount) {
    await incrementBalance(
      ctx,
      existing.accountId,
      revertDelta(existing.type, oldAmount) + txDelta(existing.type, newAmount)
    );
    if (pair) {
      await incrementBalance(
        ctx,
        pair.accountId,
        revertDelta(pair.type, oldAmount) + txDelta(pair.type, newAmount)
      );
    }
  }

  const shared = {
    amount: newAmount,
    concept: raw.concept,
    date: new Date(raw.date),
    notes: raw.notes,
  };
  await ctx.tx.transaction.update({ where: { id: existing.id }, data: shared });
  if (pair) {
    await ctx.tx.transaction.update({ where: { id: pair.id }, data: shared });
  }
}
