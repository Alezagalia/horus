import { Food } from '../../../generated/prisma/client.js';
import { logger } from '../../../lib/logger.js';
import { PushContext, logIfConflict } from '../push-context.js';
import { recordTombstones } from '../tombstone.service.js';
import { FoodRaw } from '../types.js';

/**
 * Alimentos (nutrición). Soft delete via is_active. Unique (userId, name):
 * un create que colisiona por nombre se fusiona en la fila existente (LWW
 * client-wins), se registra tombstone del id entrante (para que los clientes
 * borren su copia huérfana) y el remap devuelto corrige las referencias
 * food_id de los hijos del mismo push (ingredientes, items).
 */

export function toRaw(f: Food): FoodRaw {
  return {
    id: f.id,
    name: f.name,
    brand: f.brand,
    calories: Number(f.calories),
    protein: Number(f.protein),
    carbs: Number(f.carbs),
    fat: Number(f.fat),
    fiber: f.fiber != null ? Number(f.fiber) : null,
    unit: f.unit,
    is_active: f.isActive,
    created_at: f.createdAt.getTime(),
    updated_at: f.updatedAt.getTime(),
  };
}

function dataFromRaw(raw: FoodRaw) {
  return {
    name: raw.name,
    brand: raw.brand,
    calories: raw.calories,
    protein: raw.protein,
    carbs: raw.carbs,
    fat: raw.fat,
    fiber: raw.fiber,
    unit: raw.unit || 'g',
    isActive: raw.is_active ?? true,
  };
}

export async function applyCreated(
  ctx: PushContext,
  raws: FoodRaw[]
): Promise<Map<string, string>> {
  const remap = new Map<string, string>();

  for (const raw of raws) {
    const existing = await ctx.tx.food.findUnique({ where: { id: raw.id } });
    if (existing) continue; // retry de push: no re-crear

    const byName = await ctx.tx.food.findUnique({
      where: { userId_name: { userId: ctx.userId, name: raw.name } },
    });
    if (byName) {
      logger.warn(`[replication] food ${raw.id} colisiona por nombre con ${byName.id}: se fusiona`);
      await ctx.tx.food.update({ where: { id: byName.id }, data: dataFromRaw(raw) });
      await recordTombstones(ctx.tx, ctx.userId, 'foods', [raw.id]);
      remap.set(raw.id, byName.id);
      continue;
    }

    await ctx.tx.food.create({
      data: { id: raw.id, userId: ctx.userId, ...dataFromRaw(raw) },
    });
  }

  return remap;
}

export async function applyUpdated(ctx: PushContext, raws: FoodRaw[]): Promise<void> {
  for (let raw of raws) {
    const existing = await ctx.tx.food.findUnique({ where: { id: raw.id } });
    if (!existing) {
      await applyCreated(ctx, [raw]);
      continue;
    }
    if (existing.userId !== ctx.userId) continue;

    // Rename que colisiona con otro food del usuario: se conserva el nombre viejo
    if (raw.name !== existing.name) {
      const byName = await ctx.tx.food.findUnique({
        where: { userId_name: { userId: ctx.userId, name: raw.name } },
      });
      if (byName && byName.id !== raw.id) {
        logger.warn(
          `[replication] update de food ${raw.id} renombra a "${raw.name}" que ya existe: se conserva el nombre previo`
        );
        raw = { ...raw, name: existing.name };
      }
    }

    logIfConflict(ctx, 'foods', raw.id, existing.updatedAt);
    await ctx.tx.food.update({ where: { id: raw.id }, data: dataFromRaw(raw) });
  }
}
