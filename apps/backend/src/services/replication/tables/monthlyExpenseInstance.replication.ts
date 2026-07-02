import { MonthlyExpenseInstance } from '../../../generated/prisma/client.js';
import { logger } from '../../../lib/logger.js';
import { round2 } from '../balance.js';
import { PushContext, logIfConflict } from '../push-context.js';
import { MonthlyExpenseInstanceRaw } from '../types.js';

export function toRaw(m: MonthlyExpenseInstance): MonthlyExpenseInstanceRaw {
  return {
    id: m.id,
    recurring_expense_id: m.recurringExpenseId,
    month: m.month,
    year: m.year,
    concept: m.concept,
    category_id: m.categoryId,
    amount: Number(m.amount),
    previous_amount: m.previousAmount === null ? null : Number(m.previousAmount),
    account_id: m.accountId,
    paid_date: m.paidDate ? m.paidDate.getTime() : null,
    status: m.status,
    notes: m.notes,
    created_at: m.createdAt.getTime(),
    updated_at: m.updatedAt.getTime(),
  };
}

/** Las instancias las genera SOLO el server (cron + on-demand); un created del
 * cliente es un bug o un cliente viejo. */
export async function applyCreated(
  _ctx: PushContext,
  raws: MonthlyExpenseInstanceRaw[]
): Promise<void> {
  for (const raw of raws) {
    logger.warn(`[replication] monthly_expense_instance ${raw.id} created por cliente: ignorada`);
  }
}

export async function applyUpdated(
  ctx: PushContext,
  raws: MonthlyExpenseInstanceRaw[]
): Promise<void> {
  for (const raw of raws) {
    const existing = await ctx.tx.monthlyExpenseInstance.findUnique({ where: { id: raw.id } });
    if (!existing) {
      logger.warn(`[replication] monthly_expense_instance ${raw.id} inexistente: ignorada`);
      continue;
    }
    if (existing.userId !== ctx.userId) continue;
    logIfConflict(ctx, 'monthly_expense_instances', raw.id, existing.updatedAt);

    if (raw.status === 'pagado' && existing.status === 'pendiente') {
      await applyPayment(ctx, raw, existing);
    } else if (raw.status === 'pendiente' && existing.status === 'pagado') {
      // Undo offline: el cliente además manda transactions.deleted con la tx del
      // pago (misma semántica que undoMonthlyExpensePayment). Acá solo se
      // revierte el estado de la instancia.
      await ctx.tx.monthlyExpenseInstance.update({
        where: { id: raw.id },
        data: {
          status: 'pendiente',
          accountId: null,
          paidDate: null,
          amount: round2(raw.amount ?? Number(existing.previousAmount ?? 0)),
        },
      });
    } else {
      // Ediciones sin cambio de estado (notes, amount). Si el amount de un gasto
      // pagado cambia, la tx asociada llega en transactions.updated y ajusta el
      // saldo por su lado.
      await ctx.tx.monthlyExpenseInstance.update({
        where: { id: raw.id },
        data: {
          amount: round2(raw.amount),
          notes: raw.notes,
          ...(raw.paid_date !== null && existing.status === 'pagado'
            ? { paidDate: new Date(raw.paid_date) }
            : {}),
        },
      });
    }
  }
}

/**
 * Pago hecho offline. Mismo claim atómico que `payMonthlyExpense`: updateMany
 * con guard status='pendiente' — si otro request (web, otro device) ya pagó,
 * count=0 y la transaction entrante asociada se descarta (skippedInstanceIds)
 * para no imputar el gasto dos veces.
 */
async function applyPayment(
  ctx: PushContext,
  raw: MonthlyExpenseInstanceRaw,
  existing: MonthlyExpenseInstance
): Promise<void> {
  if (!raw.account_id) {
    logger.warn(`[replication] pago de ${raw.id} sin account_id: ignorado`);
    ctx.skippedInstanceIds.add(raw.id);
    return;
  }
  const account = await ctx.tx.account.findUnique({ where: { id: raw.account_id } });
  if (!account || account.userId !== ctx.userId) {
    logger.warn(`[replication] pago de ${raw.id} con cuenta ajena/inexistente: ignorado`);
    ctx.skippedInstanceIds.add(raw.id);
    return;
  }

  const claimed = await ctx.tx.monthlyExpenseInstance.updateMany({
    where: { id: raw.id, userId: ctx.userId, status: 'pendiente' },
    data: {
      status: 'pagado',
      amount: round2(raw.amount),
      previousAmount: existing.amount, // el amount pre-pago del server, como en payMonthlyExpense
      accountId: raw.account_id,
      paidDate: raw.paid_date ? new Date(raw.paid_date) : new Date(),
      notes: raw.notes,
    },
  });

  if (claimed.count === 0) {
    // Carrera: otro request pagó entre nuestro read y el update.
    logger.warn(`[replication] claim de pago perdido para ${raw.id}: tx entrante descartada`);
    ctx.skippedInstanceIds.add(raw.id);
  }
}
