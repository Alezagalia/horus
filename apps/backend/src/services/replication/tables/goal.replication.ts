import { Goal, GoalStatus, Priority, Scope } from '../../../generated/prisma/client.js';
import { logger } from '../../../lib/logger.js';
import { PushContext, logIfConflict } from '../push-context.js';
import { GoalRaw } from '../types.js';

export function toRaw(g: Goal): GoalRaw {
  return {
    id: g.id,
    category_id: g.categoryId,
    title: g.title,
    description: g.description,
    priority: g.priority,
    status: g.status,
    target_date: g.targetDate ? g.targetDate.getTime() : null,
    completed_at: g.completedAt ? g.completedAt.getTime() : null,
    is_active: g.isActive,
    is_featured: g.isFeatured,
    created_at: g.createdAt.getTime(),
    updated_at: g.updatedAt.getTime(),
  };
}

/** categoryId es nullable en Goal; si viene, debe ser del user y scope metas. */
async function goalCategoryIsValid(ctx: PushContext, categoryId: string | null): Promise<boolean> {
  if (!categoryId) return true;
  const category = await ctx.tx.category.findUnique({ where: { id: categoryId } });
  return category !== null && category.userId === ctx.userId && category.scope === Scope.metas;
}

const msToDate = (ms: number | null | undefined): Date | null => (ms != null ? new Date(ms) : null);

export async function applyCreated(ctx: PushContext, raws: GoalRaw[]): Promise<void> {
  for (const raw of raws) {
    const existing = await ctx.tx.goal.findUnique({ where: { id: raw.id } });
    if (existing) continue; // retry de push: no re-crear

    const categoryId = (await goalCategoryIsValid(ctx, raw.category_id)) ? raw.category_id : null;

    await ctx.tx.goal.create({
      data: {
        id: raw.id,
        userId: ctx.userId,
        categoryId,
        title: raw.title,
        description: raw.description,
        priority: raw.priority as Priority,
        status: raw.status as GoalStatus,
        targetDate: msToDate(raw.target_date),
        completedAt: msToDate(raw.completed_at),
        isActive: raw.is_active ?? true,
        isFeatured: raw.is_featured ?? false,
      },
    });
  }
}

export async function applyUpdated(ctx: PushContext, raws: GoalRaw[]): Promise<void> {
  for (const raw of raws) {
    const existing = await ctx.tx.goal.findUnique({ where: { id: raw.id } });
    if (!existing) {
      // Watermelon puede degradar created→updated si el pull intermedio falló
      await applyCreated(ctx, [raw]);
      continue;
    }
    if (existing.userId !== ctx.userId) continue;
    logIfConflict(ctx, 'goals', raw.id, existing.updatedAt);

    let categoryId = raw.category_id;
    if (categoryId !== existing.categoryId && !(await goalCategoryIsValid(ctx, categoryId))) {
      categoryId = existing.categoryId;
    }

    // isFeatured: el cliente espeja la invariante "una sola destacada"
    // (des-destaca todas antes de destacar) — todas viajan como updated.
    await ctx.tx.goal.update({
      where: { id: raw.id },
      data: {
        categoryId,
        title: raw.title,
        description: raw.description,
        priority: raw.priority as Priority,
        status: raw.status as GoalStatus,
        targetDate: msToDate(raw.target_date),
        completedAt: msToDate(raw.completed_at),
        isActive: raw.is_active,
        isFeatured: raw.is_featured ?? existing.isFeatured,
      },
    });
  }
}

export function warnOnDeleted(ids: string[]): void {
  if (ids.length > 0) {
    logger.warn(`[replication] deleted de goals ignorado (soft delete): ${ids.join(',')}`);
  }
}
