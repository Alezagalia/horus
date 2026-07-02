import { Budget, Prisma } from '../../../generated/prisma/client.js';
import { logger } from '../../../lib/logger.js';
import { round2 } from '../balance.js';
import { PushContext, logIfConflict } from '../push-context.js';
import { BudgetRaw } from '../types.js';

export function toRaw(b: Budget): BudgetRaw {
  return {
    id: b.id,
    category_id: b.categoryId,
    amount: Number(b.amount),
    currency: b.currency,
    is_active: b.isActive,
    created_at: b.createdAt.getTime(),
    updated_at: b.updatedAt.getTime(),
  };
}

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

export async function applyCreated(ctx: PushContext, raws: BudgetRaw[]): Promise<void> {
  for (const raw of raws) {
    const existing = await ctx.tx.budget.findUnique({ where: { id: raw.id } });
    if (existing) continue;

    const category = await ctx.tx.category.findUnique({ where: { id: raw.category_id } });
    if (!category || category.userId !== ctx.userId) {
      logger.warn(`[replication] budget ${raw.id} con categoría ajena/inexistente: ignorado`);
      continue;
    }

    try {
      await ctx.tx.budget.create({
        data: {
          id: raw.id,
          userId: ctx.userId,
          categoryId: raw.category_id,
          amount: round2(raw.amount),
          currency: raw.currency,
          isActive: raw.is_active ?? true,
        },
      });
    } catch (error) {
      // (userId, categoryId, currency) único: ya hay budget para esa categoría/moneda
      if (isUniqueViolation(error)) {
        logger.warn(`[replication] budget duplicado para categoría ${raw.category_id}: ignorado`);
        continue;
      }
      throw error;
    }
  }
}

export async function applyUpdated(ctx: PushContext, raws: BudgetRaw[]): Promise<void> {
  for (const raw of raws) {
    const existing = await ctx.tx.budget.findUnique({ where: { id: raw.id } });
    if (!existing) {
      await applyCreated(ctx, [raw]);
      continue;
    }
    if (existing.userId !== ctx.userId) continue;
    logIfConflict(ctx, 'budgets', raw.id, existing.updatedAt);

    try {
      await ctx.tx.budget.update({
        where: { id: raw.id },
        data: {
          categoryId: raw.category_id,
          amount: round2(raw.amount),
          currency: raw.currency,
          isActive: raw.is_active,
        },
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        logger.warn(`[replication] update de budget ${raw.id} choca con unique: ignorado`);
        continue;
      }
      throw error;
    }
  }
}
