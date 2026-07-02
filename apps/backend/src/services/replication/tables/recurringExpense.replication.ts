import { RecurringExpense } from '../../../generated/prisma/client.js';
import { logger } from '../../../lib/logger.js';
import { PushContext, logIfConflict } from '../push-context.js';
import { RecurringExpenseRaw } from '../types.js';

export function toRaw(r: RecurringExpense): RecurringExpenseRaw {
  return {
    id: r.id,
    concept: r.concept,
    category_id: r.categoryId,
    currency: r.currency,
    due_day: r.dueDay,
    notes: r.notes,
    is_active: r.isActive,
    last_reviewed_at: r.lastReviewedAt.getTime(),
    created_at: r.createdAt.getTime(),
    updated_at: r.updatedAt.getTime(),
  };
}

async function categoryBelongsToUser(ctx: PushContext, categoryId: string): Promise<boolean> {
  const category = await ctx.tx.category.findUnique({ where: { id: categoryId } });
  return category !== null && category.userId === ctx.userId;
}

export async function applyCreated(ctx: PushContext, raws: RecurringExpenseRaw[]): Promise<void> {
  for (const raw of raws) {
    const existing = await ctx.tx.recurringExpense.findUnique({ where: { id: raw.id } });
    if (existing) continue;

    if (!(await categoryBelongsToUser(ctx, raw.category_id))) {
      logger.warn(
        `[replication] recurring_expense ${raw.id} con categoría ajena/inexistente: ignorado`
      );
      continue;
    }

    // NOTA: la instancia mensual NO se crea acá — la genera el server (cron/on-demand)
    // y le llega al cliente en el próximo pull.
    await ctx.tx.recurringExpense.create({
      data: {
        id: raw.id,
        userId: ctx.userId,
        concept: raw.concept,
        categoryId: raw.category_id,
        currency: raw.currency,
        dueDay: raw.due_day,
        notes: raw.notes,
        isActive: raw.is_active ?? true,
        lastReviewedAt: raw.last_reviewed_at ? new Date(raw.last_reviewed_at) : undefined,
      },
    });
  }
}

export async function applyUpdated(ctx: PushContext, raws: RecurringExpenseRaw[]): Promise<void> {
  for (const raw of raws) {
    const existing = await ctx.tx.recurringExpense.findUnique({ where: { id: raw.id } });
    if (!existing) {
      await applyCreated(ctx, [raw]);
      continue;
    }
    if (existing.userId !== ctx.userId) continue;
    logIfConflict(ctx, 'recurring_expenses', raw.id, existing.updatedAt);

    let categoryId = raw.category_id;
    if (categoryId !== existing.categoryId && !(await categoryBelongsToUser(ctx, categoryId))) {
      categoryId = existing.categoryId;
    }

    await ctx.tx.recurringExpense.update({
      where: { id: raw.id },
      data: {
        concept: raw.concept,
        categoryId,
        currency: raw.currency,
        dueDay: raw.due_day,
        notes: raw.notes,
        isActive: raw.is_active,
        lastReviewedAt: raw.last_reviewed_at ? new Date(raw.last_reviewed_at) : undefined,
      },
    });
  }
}
