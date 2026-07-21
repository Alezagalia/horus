import { Recipe, RecipeIngredient } from '../../../generated/prisma/client.js';
import { logger } from '../../../lib/logger.js';
import { PushContext, logIfConflict } from '../push-context.js';
import { recordTombstones } from '../tombstone.service.js';
import { RecipeIngredientRaw, RecipeRaw } from '../types.js';

/**
 * Recetas + ingredientes (nutrición). Recipe: soft delete via is_active.
 * RecipeIngredient: hard delete con tombstones, sin userId propio (ownership
 * vía su recipe), unique (recipeId, foodId) — colisión se fusiona en la fila
 * existente con tombstone del id entrante.
 */

export function toRaw(r: Recipe): RecipeRaw {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    servings: r.servings,
    is_active: r.isActive,
    created_at: r.createdAt.getTime(),
    updated_at: r.updatedAt.getTime(),
  };
}

export function ingredientToRaw(i: RecipeIngredient): RecipeIngredientRaw {
  return {
    id: i.id,
    recipe_id: i.recipeId,
    food_id: i.foodId,
    grams: Number(i.grams),
    notes: i.notes,
    created_at: i.createdAt.getTime(),
    updated_at: i.updatedAt.getTime(),
  };
}

export async function applyCreated(ctx: PushContext, raws: RecipeRaw[]): Promise<void> {
  for (const raw of raws) {
    const existing = await ctx.tx.recipe.findUnique({ where: { id: raw.id } });
    if (existing) continue;

    await ctx.tx.recipe.create({
      data: {
        id: raw.id,
        userId: ctx.userId,
        name: raw.name,
        description: raw.description,
        servings: raw.servings ?? 1,
        isActive: raw.is_active ?? true,
      },
    });
  }
}

export async function applyUpdated(ctx: PushContext, raws: RecipeRaw[]): Promise<void> {
  for (const raw of raws) {
    const existing = await ctx.tx.recipe.findUnique({ where: { id: raw.id } });
    if (!existing) {
      await applyCreated(ctx, [raw]);
      continue;
    }
    if (existing.userId !== ctx.userId) continue;
    logIfConflict(ctx, 'recipes', raw.id, existing.updatedAt);

    await ctx.tx.recipe.update({
      where: { id: raw.id },
      data: {
        name: raw.name,
        description: raw.description,
        servings: raw.servings ?? 1,
        isActive: raw.is_active,
      },
    });
  }
}

async function recipeOfUser(ctx: PushContext, recipeId: string): Promise<boolean> {
  const recipe = await ctx.tx.recipe.findUnique({ where: { id: recipeId } });
  return !!recipe && recipe.userId === ctx.userId;
}

/** Resuelve el food del ingrediente: remap del push actual + ownership. */
async function resolveFoodId(
  ctx: PushContext,
  rawFoodId: string,
  foodRemap: Map<string, string>
): Promise<string | null> {
  const foodId = foodRemap.get(rawFoodId) ?? rawFoodId;
  const food = await ctx.tx.food.findUnique({ where: { id: foodId } });
  if (!food || food.userId !== ctx.userId) return null;
  return foodId;
}

export async function applyIngredients(
  ctx: PushContext,
  raws: RecipeIngredientRaw[],
  foodRemap: Map<string, string>
): Promise<void> {
  for (const raw of raws) {
    if (!(await recipeOfUser(ctx, raw.recipe_id))) {
      logger.warn(
        `[replication] recipe_ingredient ${raw.id} de receta ajena/inexistente: ignorado`
      );
      continue;
    }
    const foodId = await resolveFoodId(ctx, raw.food_id, foodRemap);
    if (!foodId) {
      logger.warn(`[replication] recipe_ingredient ${raw.id} con food ajeno/inexistente: ignorado`);
      continue;
    }

    const data = { grams: raw.grams, notes: raw.notes };
    const existing = await ctx.tx.recipeIngredient.findUnique({ where: { id: raw.id } });
    if (existing) {
      // No se acepta re-parenting: recipe_id/food_id no cambian
      await ctx.tx.recipeIngredient.update({ where: { id: raw.id }, data });
      continue;
    }

    const tombstone = await ctx.tx.replicationTombstone.findUnique({
      where: { tableName_rowId: { tableName: 'recipe_ingredients', rowId: raw.id } },
    });
    if (tombstone) continue;

    // Unique (recipeId, foodId): mismo food agregado por otra vía → fusionar
    const byPair = await ctx.tx.recipeIngredient.findUnique({
      where: { recipeId_foodId: { recipeId: raw.recipe_id, foodId } },
    });
    if (byPair) {
      logger.warn(
        `[replication] recipe_ingredient ${raw.id} colisiona con ${byPair.id} (misma receta/food): se fusiona`
      );
      await ctx.tx.recipeIngredient.update({ where: { id: byPair.id }, data });
      await recordTombstones(ctx.tx, ctx.userId, 'recipe_ingredients', [raw.id]);
      continue;
    }

    await ctx.tx.recipeIngredient.create({
      data: { id: raw.id, recipeId: raw.recipe_id, foodId, ...data },
    });
  }
}

export async function deleteIngredients(ctx: PushContext, ids: string[]): Promise<void> {
  for (const id of ids) {
    const existing = await ctx.tx.recipeIngredient.findUnique({
      where: { id },
      include: { recipe: { select: { userId: true } } },
    });
    if (!existing) {
      await recordTombstones(ctx.tx, ctx.userId, 'recipe_ingredients', [id]);
      continue;
    }
    if (existing.recipe.userId !== ctx.userId) continue;

    await recordTombstones(ctx.tx, ctx.userId, 'recipe_ingredients', [id]);
    await ctx.tx.recipeIngredient.delete({ where: { id } });
  }
}
