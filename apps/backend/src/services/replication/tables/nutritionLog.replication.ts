import { MealTime, NutritionLog, NutritionLogItem } from '../../../generated/prisma/client.js';
import { logger } from '../../../lib/logger.js';
import { PushContext, logIfConflict } from '../push-context.js';
import { recordTombstones } from '../tombstone.service.js';
import { NutritionLogItemRaw, NutritionLogRaw } from '../types.js';

/**
 * Registro diario de alimentación: nutrition_logs (upsert por userId+date) →
 * nutrition_log_items. Hard delete con tombstones (el log cascadea items).
 * Colisión de fecha (log creado offline en dos dispositivos): se fusiona en el
 * existente, tombstone del id entrante y remap para los items del push.
 */

const MEAL_TIMES = new Set<string>(Object.values(MealTime));

/** date es @db.Date: normalizada a medianoche UTC. */
function utcDate(ms: number): Date {
  const d = new Date(ms);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export function toRaw(l: NutritionLog): NutritionLogRaw {
  return {
    id: l.id,
    date: l.date.getTime(),
    notes: l.notes,
    created_at: l.createdAt.getTime(),
    updated_at: l.updatedAt.getTime(),
  };
}

export function itemToRaw(i: NutritionLogItem): NutritionLogItemRaw {
  return {
    id: i.id,
    nutrition_log_id: i.nutritionLogId,
    food_id: i.foodId,
    meal_time: i.mealTime,
    grams: Number(i.grams),
    servings: i.servings != null ? Number(i.servings) : null,
    notes: i.notes,
    created_at: i.createdAt.getTime(),
    updated_at: i.updatedAt.getTime(),
  };
}

export async function applyCreated(
  ctx: PushContext,
  raws: NutritionLogRaw[]
): Promise<Map<string, string>> {
  const remap = new Map<string, string>();

  for (const raw of raws) {
    const existing = await ctx.tx.nutritionLog.findUnique({ where: { id: raw.id } });
    if (existing) continue;

    const tombstone = await ctx.tx.replicationTombstone.findUnique({
      where: { tableName_rowId: { tableName: 'nutrition_logs', rowId: raw.id } },
    });
    if (tombstone) {
      logger.warn(`[replication] nutrition_log ${raw.id} con tombstone previo: create ignorado`);
      continue;
    }

    const date = utcDate(raw.date);
    const byDate = await ctx.tx.nutritionLog.findUnique({
      where: { userId_date: { userId: ctx.userId, date } },
    });
    if (byDate) {
      logger.warn(
        `[replication] nutrition_log ${raw.id} colisiona con ${byDate.id} (misma fecha): se fusiona`
      );
      await ctx.tx.nutritionLog.update({ where: { id: byDate.id }, data: { notes: raw.notes } });
      await recordTombstones(ctx.tx, ctx.userId, 'nutrition_logs', [raw.id]);
      remap.set(raw.id, byDate.id);
      continue;
    }

    await ctx.tx.nutritionLog.create({
      data: { id: raw.id, userId: ctx.userId, date, notes: raw.notes },
    });
  }

  return remap;
}

export async function applyUpdated(ctx: PushContext, raws: NutritionLogRaw[]): Promise<void> {
  for (const raw of raws) {
    const existing = await ctx.tx.nutritionLog.findUnique({ where: { id: raw.id } });
    if (!existing) {
      await applyCreated(ctx, [raw]);
      continue;
    }
    if (existing.userId !== ctx.userId) continue;
    logIfConflict(ctx, 'nutrition_logs', raw.id, existing.updatedAt);

    // date no se acepta (cambiarla es otro log)
    await ctx.tx.nutritionLog.update({ where: { id: raw.id }, data: { notes: raw.notes } });
  }
}

export async function applyDeleted(ctx: PushContext, ids: string[]): Promise<void> {
  for (const id of ids) {
    const existing = await ctx.tx.nutritionLog.findUnique({
      where: { id },
      include: { items: { select: { id: true } } },
    });
    if (!existing) {
      await recordTombstones(ctx.tx, ctx.userId, 'nutrition_logs', [id]);
      continue;
    }
    if (existing.userId !== ctx.userId) continue;

    await recordTombstones(
      ctx.tx,
      ctx.userId,
      'nutrition_log_items',
      existing.items.map((i) => i.id)
    );
    await recordTombstones(ctx.tx, ctx.userId, 'nutrition_logs', [id]);
    await ctx.tx.nutritionLog.delete({ where: { id } }); // cascadea items
  }
}

export async function applyItems(
  ctx: PushContext,
  raws: NutritionLogItemRaw[],
  logRemap: Map<string, string>,
  foodRemap: Map<string, string>
): Promise<void> {
  for (const raw of raws) {
    if (!MEAL_TIMES.has(raw.meal_time)) {
      logger.warn(`[replication] nutrition_log_item ${raw.id} con meal_time inválido: ignorado`);
      continue;
    }

    // food inválido → null (como SetNull); el item conserva grams/notas
    let foodId: string | null = null;
    if (raw.food_id) {
      const mapped = foodRemap.get(raw.food_id) ?? raw.food_id;
      const food = await ctx.tx.food.findUnique({ where: { id: mapped } });
      foodId = food && food.userId === ctx.userId ? mapped : null;
    }

    const data = {
      foodId,
      mealTime: raw.meal_time as MealTime,
      grams: raw.grams,
      servings: raw.servings,
      notes: raw.notes,
    };

    const existing = await ctx.tx.nutritionLogItem.findUnique({
      where: { id: raw.id },
      include: { nutritionLog: { select: { userId: true } } },
    });
    if (existing) {
      if (existing.nutritionLog.userId !== ctx.userId) continue;
      // nutrition_log_id no se acepta (re-parenting)
      await ctx.tx.nutritionLogItem.update({ where: { id: raw.id }, data });
      continue;
    }

    const tombstone = await ctx.tx.replicationTombstone.findUnique({
      where: { tableName_rowId: { tableName: 'nutrition_log_items', rowId: raw.id } },
    });
    if (tombstone) continue;

    const logId = logRemap.get(raw.nutrition_log_id) ?? raw.nutrition_log_id;
    const log = await ctx.tx.nutritionLog.findUnique({ where: { id: logId } });
    if (!log || log.userId !== ctx.userId) {
      logger.warn(`[replication] nutrition_log_item ${raw.id} de log ajeno/inexistente: ignorado`);
      continue;
    }

    await ctx.tx.nutritionLogItem.create({
      data: { id: raw.id, nutritionLogId: logId, ...data },
    });
  }
}

export async function deleteItems(ctx: PushContext, ids: string[]): Promise<void> {
  for (const id of ids) {
    const existing = await ctx.tx.nutritionLogItem.findUnique({
      where: { id },
      include: { nutritionLog: { select: { userId: true } } },
    });
    if (!existing) {
      await recordTombstones(ctx.tx, ctx.userId, 'nutrition_log_items', [id]);
      continue;
    }
    if (existing.nutritionLog.userId !== ctx.userId) continue;

    await recordTombstones(ctx.tx, ctx.userId, 'nutrition_log_items', [id]);
    await ctx.tx.nutritionLogItem.delete({ where: { id } });
  }
}
