import { MealEntry, MealEntryItem, MealPlan, MealTime } from '../../../generated/prisma/client.js';
import { logger } from '../../../lib/logger.js';
import { PushContext, logIfConflict } from '../push-context.js';
import { recordTombstones } from '../tombstone.service.js';
import { MealEntryItemRaw, MealEntryRaw, MealPlanRaw } from '../types.js';

/**
 * Plan semanal de comidas: meal_plans (upsert por userId+weekStart) →
 * meal_entries → meal_entry_items. Todo hard delete con tombstones (el plan
 * cascadea entries e items: se registran sus tombstones antes de borrar).
 * Colisión de weekStart (plan creado offline en dos dispositivos): se fusiona
 * en el existente, tombstone del id entrante y remap para los hijos del push.
 */

const MEAL_TIMES = new Set<string>(Object.values(MealTime));

/** weekStart/day son @db.Date: normalizados a medianoche UTC. */
function utcDate(ms: number): Date {
  const d = new Date(ms);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export function toRaw(p: MealPlan): MealPlanRaw {
  return {
    id: p.id,
    week_start: p.weekStart.getTime(),
    notes: p.notes,
    created_at: p.createdAt.getTime(),
    updated_at: p.updatedAt.getTime(),
  };
}

export function entryToRaw(e: MealEntry): MealEntryRaw {
  return {
    id: e.id,
    meal_plan_id: e.mealPlanId,
    day: e.day.getTime(),
    meal_time: e.mealTime,
    notes: e.notes,
    created_at: e.createdAt.getTime(),
    updated_at: e.updatedAt.getTime(),
  };
}

export function itemToRaw(i: MealEntryItem): MealEntryItemRaw {
  return {
    id: i.id,
    meal_entry_id: i.mealEntryId,
    food_id: i.foodId,
    recipe_id: i.recipeId,
    grams: Number(i.grams),
    servings: i.servings != null ? Number(i.servings) : null,
    created_at: i.createdAt.getTime(),
    updated_at: i.updatedAt.getTime(),
  };
}

export async function applyCreated(
  ctx: PushContext,
  raws: MealPlanRaw[]
): Promise<Map<string, string>> {
  const remap = new Map<string, string>();

  for (const raw of raws) {
    const existing = await ctx.tx.mealPlan.findUnique({ where: { id: raw.id } });
    if (existing) continue;

    const tombstone = await ctx.tx.replicationTombstone.findUnique({
      where: { tableName_rowId: { tableName: 'meal_plans', rowId: raw.id } },
    });
    if (tombstone) {
      logger.warn(`[replication] meal_plan ${raw.id} con tombstone previo: create ignorado`);
      continue;
    }

    const weekStart = utcDate(raw.week_start);
    const byWeek = await ctx.tx.mealPlan.findUnique({
      where: { userId_weekStart: { userId: ctx.userId, weekStart } },
    });
    if (byWeek) {
      logger.warn(
        `[replication] meal_plan ${raw.id} colisiona con ${byWeek.id} (misma semana): se fusiona`
      );
      await ctx.tx.mealPlan.update({ where: { id: byWeek.id }, data: { notes: raw.notes } });
      await recordTombstones(ctx.tx, ctx.userId, 'meal_plans', [raw.id]);
      remap.set(raw.id, byWeek.id);
      continue;
    }

    await ctx.tx.mealPlan.create({
      data: { id: raw.id, userId: ctx.userId, weekStart, notes: raw.notes },
    });
  }

  return remap;
}

export async function applyUpdated(ctx: PushContext, raws: MealPlanRaw[]): Promise<void> {
  for (const raw of raws) {
    const existing = await ctx.tx.mealPlan.findUnique({ where: { id: raw.id } });
    if (!existing) {
      await applyCreated(ctx, [raw]);
      continue;
    }
    if (existing.userId !== ctx.userId) continue;
    logIfConflict(ctx, 'meal_plans', raw.id, existing.updatedAt);

    // weekStart no se acepta (cambiarla es borrar y crear otro plan)
    await ctx.tx.mealPlan.update({ where: { id: raw.id }, data: { notes: raw.notes } });
  }
}

export async function applyDeleted(ctx: PushContext, ids: string[]): Promise<void> {
  for (const id of ids) {
    const existing = await ctx.tx.mealPlan.findUnique({
      where: { id },
      include: { entries: { select: { id: true, items: { select: { id: true } } } } },
    });
    if (!existing) {
      await recordTombstones(ctx.tx, ctx.userId, 'meal_plans', [id]);
      continue;
    }
    if (existing.userId !== ctx.userId) continue;

    const entryIds = existing.entries.map((e) => e.id);
    const itemIds = existing.entries.flatMap((e) => e.items.map((i) => i.id));
    await recordTombstones(ctx.tx, ctx.userId, 'meal_entry_items', itemIds);
    await recordTombstones(ctx.tx, ctx.userId, 'meal_entries', entryIds);
    await recordTombstones(ctx.tx, ctx.userId, 'meal_plans', [id]);
    await ctx.tx.mealPlan.delete({ where: { id } }); // cascadea entries e items
  }
}

async function planOfUser(
  ctx: PushContext,
  rawPlanId: string,
  planRemap: Map<string, string>
): Promise<string | null> {
  const planId = planRemap.get(rawPlanId) ?? rawPlanId;
  const plan = await ctx.tx.mealPlan.findUnique({ where: { id: planId } });
  if (!plan || plan.userId !== ctx.userId) return null;
  return planId;
}

export async function applyEntries(
  ctx: PushContext,
  raws: MealEntryRaw[],
  planRemap: Map<string, string>
): Promise<void> {
  for (const raw of raws) {
    if (!MEAL_TIMES.has(raw.meal_time)) {
      logger.warn(`[replication] meal_entry ${raw.id} con meal_time inválido: ignorado`);
      continue;
    }

    const existing = await ctx.tx.mealEntry.findUnique({
      where: { id: raw.id },
      include: { mealPlan: { select: { userId: true } } },
    });
    if (existing) {
      if (existing.mealPlan.userId !== ctx.userId) continue;
      // meal_plan_id no se acepta (re-parenting)
      await ctx.tx.mealEntry.update({
        where: { id: raw.id },
        data: {
          day: utcDate(raw.day),
          mealTime: raw.meal_time as MealTime,
          notes: raw.notes,
        },
      });
      continue;
    }

    const tombstone = await ctx.tx.replicationTombstone.findUnique({
      where: { tableName_rowId: { tableName: 'meal_entries', rowId: raw.id } },
    });
    if (tombstone) continue;

    const planId = await planOfUser(ctx, raw.meal_plan_id, planRemap);
    if (!planId) {
      logger.warn(`[replication] meal_entry ${raw.id} de plan ajeno/inexistente: ignorado`);
      continue;
    }

    await ctx.tx.mealEntry.create({
      data: {
        id: raw.id,
        mealPlanId: planId,
        day: utcDate(raw.day),
        mealTime: raw.meal_time as MealTime,
        notes: raw.notes,
      },
    });
  }
}

export async function deleteEntries(ctx: PushContext, ids: string[]): Promise<void> {
  for (const id of ids) {
    const existing = await ctx.tx.mealEntry.findUnique({
      where: { id },
      include: {
        mealPlan: { select: { userId: true } },
        items: { select: { id: true } },
      },
    });
    if (!existing) {
      await recordTombstones(ctx.tx, ctx.userId, 'meal_entries', [id]);
      continue;
    }
    if (existing.mealPlan.userId !== ctx.userId) continue;

    await recordTombstones(
      ctx.tx,
      ctx.userId,
      'meal_entry_items',
      existing.items.map((i) => i.id)
    );
    await recordTombstones(ctx.tx, ctx.userId, 'meal_entries', [id]);
    await ctx.tx.mealEntry.delete({ where: { id } }); // cascadea items
  }
}

/** Valida food/recipe del usuario; referencia inválida → null (como SetNull). */
async function safeItemRefs(
  ctx: PushContext,
  raw: MealEntryItemRaw,
  foodRemap: Map<string, string>
): Promise<{ foodId: string | null; recipeId: string | null }> {
  let foodId: string | null = null;
  let recipeId: string | null = null;
  if (raw.food_id) {
    const mapped = foodRemap.get(raw.food_id) ?? raw.food_id;
    const food = await ctx.tx.food.findUnique({ where: { id: mapped } });
    foodId = food && food.userId === ctx.userId ? mapped : null;
  }
  if (raw.recipe_id) {
    const recipe = await ctx.tx.recipe.findUnique({ where: { id: raw.recipe_id } });
    recipeId = recipe && recipe.userId === ctx.userId ? raw.recipe_id : null;
  }
  return { foodId, recipeId };
}

export async function applyEntryItems(
  ctx: PushContext,
  raws: MealEntryItemRaw[],
  foodRemap: Map<string, string>
): Promise<void> {
  for (const raw of raws) {
    const refs = await safeItemRefs(ctx, raw, foodRemap);
    if (!refs.foodId && !refs.recipeId) {
      logger.warn(`[replication] meal_entry_item ${raw.id} sin food ni recipe válidos: ignorado`);
      continue;
    }

    const data = {
      foodId: refs.foodId,
      recipeId: refs.recipeId,
      grams: raw.grams,
      servings: raw.servings,
    };

    const existing = await ctx.tx.mealEntryItem.findUnique({
      where: { id: raw.id },
      include: { mealEntry: { include: { mealPlan: { select: { userId: true } } } } },
    });
    if (existing) {
      if (existing.mealEntry.mealPlan.userId !== ctx.userId) continue;
      // meal_entry_id no se acepta (re-parenting)
      await ctx.tx.mealEntryItem.update({ where: { id: raw.id }, data });
      continue;
    }

    const tombstone = await ctx.tx.replicationTombstone.findUnique({
      where: { tableName_rowId: { tableName: 'meal_entry_items', rowId: raw.id } },
    });
    if (tombstone) continue;

    const entry = await ctx.tx.mealEntry.findUnique({
      where: { id: raw.meal_entry_id },
      include: { mealPlan: { select: { userId: true } } },
    });
    if (!entry || entry.mealPlan.userId !== ctx.userId) {
      logger.warn(`[replication] meal_entry_item ${raw.id} de entry ajena/inexistente: ignorado`);
      continue;
    }

    await ctx.tx.mealEntryItem.create({
      data: { id: raw.id, mealEntryId: raw.meal_entry_id, ...data },
    });
  }
}

export async function deleteEntryItems(ctx: PushContext, ids: string[]): Promise<void> {
  for (const id of ids) {
    const existing = await ctx.tx.mealEntryItem.findUnique({
      where: { id },
      include: { mealEntry: { include: { mealPlan: { select: { userId: true } } } } },
    });
    if (!existing) {
      await recordTombstones(ctx.tx, ctx.userId, 'meal_entry_items', [id]);
      continue;
    }
    if (existing.mealEntry.mealPlan.userId !== ctx.userId) continue;

    await recordTombstones(ctx.tx, ctx.userId, 'meal_entry_items', [id]);
    await ctx.tx.mealEntryItem.delete({ where: { id } });
  }
}
