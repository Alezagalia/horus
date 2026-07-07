import { Habit, HabitType, Periodicity, Scope } from '../../../generated/prisma/client.js';
import { logger } from '../../../lib/logger.js';
import { PushContext, logIfConflict } from '../push-context.js';
import { HabitRaw } from '../types.js';

export function toRaw(h: Habit): HabitRaw {
  return {
    id: h.id,
    category_id: h.categoryId,
    name: h.name,
    description: h.description,
    type: h.type,
    target_value: h.targetValue,
    unit: h.unit,
    periodicity: h.periodicity,
    week_days: JSON.stringify(h.weekDays),
    time_of_day: h.timeOfDay,
    reminder_time: h.reminderTime,
    color: h.color,
    sort_order: h.order,
    is_active: h.isActive,
    current_streak: h.currentStreak,
    longest_streak: h.longestStreak,
    last_completed_date: h.lastCompletedDate ? h.lastCompletedDate.getTime() : null,
    created_at: h.createdAt.getTime(),
    updated_at: h.updatedAt.getTime(),
  };
}

function parseWeekDays(raw: string | null | undefined): number[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
      : [];
  } catch {
    return [];
  }
}

async function habitCategoryIsValid(ctx: PushContext, categoryId: string): Promise<boolean> {
  const category = await ctx.tx.category.findUnique({ where: { id: categoryId } });
  return category !== null && category.userId === ctx.userId && category.scope === Scope.habitos;
}

export async function applyCreated(ctx: PushContext, raws: HabitRaw[]): Promise<void> {
  for (const raw of raws) {
    const existing = await ctx.tx.habit.findUnique({ where: { id: raw.id } });
    if (existing) continue; // retry de push: no re-crear

    if (!(await habitCategoryIsValid(ctx, raw.category_id))) {
      logger.warn(`[replication] habit ${raw.id} con categoría ajena/inválida: ignorado`);
      continue;
    }

    // Streaks: en un create offline el cliente arranca en 0; si trae valores
    // (racha optimista local) se aceptan como semilla y el recalc de los
    // records del mismo push los corrige.
    await ctx.tx.habit.create({
      data: {
        id: raw.id,
        userId: ctx.userId,
        categoryId: raw.category_id,
        name: raw.name,
        description: raw.description,
        type: raw.type as HabitType,
        targetValue: raw.target_value,
        unit: raw.unit,
        periodicity: raw.periodicity as Periodicity,
        weekDays: parseWeekDays(raw.week_days),
        timeOfDay: raw.time_of_day || 'ANYTIME',
        reminderTime: raw.reminder_time,
        color: raw.color,
        order: raw.sort_order ?? 0,
        isActive: raw.is_active ?? true,
      },
    });
  }
}

export async function applyUpdated(ctx: PushContext, raws: HabitRaw[]): Promise<void> {
  for (const raw of raws) {
    const existing = await ctx.tx.habit.findUnique({ where: { id: raw.id } });
    if (!existing) {
      // Watermelon puede degradar created→updated si el pull intermedio falló
      await applyCreated(ctx, [raw]);
      continue;
    }
    if (existing.userId !== ctx.userId) continue;
    logIfConflict(ctx, 'habits', raw.id, existing.updatedAt);

    let categoryId = raw.category_id;
    if (categoryId !== existing.categoryId && !(await habitCategoryIsValid(ctx, categoryId))) {
      categoryId = existing.categoryId;
    }

    // current_streak / longest_streak / last_completed_date NO se aceptan:
    // son derivados del server (el recalc por records del push los actualiza).
    await ctx.tx.habit.update({
      where: { id: raw.id },
      data: {
        categoryId,
        name: raw.name,
        description: raw.description,
        type: raw.type as HabitType,
        targetValue: raw.target_value,
        unit: raw.unit,
        periodicity: raw.periodicity as Periodicity,
        weekDays: parseWeekDays(raw.week_days),
        timeOfDay: raw.time_of_day || existing.timeOfDay,
        reminderTime: raw.reminder_time,
        color: raw.color,
        order: raw.sort_order ?? existing.order,
        isActive: raw.is_active,
      },
    });
  }
}
