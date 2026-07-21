import { Q } from '@nozbe/watermelondb';
import { database } from './index';
import { requestSync } from './syncScheduler';
import {
  foods,
  recipes,
  recipeIngredients,
  getRecipeLocal,
  toFood,
  mealPlans,
  mealEntries,
  mealEntryItems,
  nutritionLogs,
  nutritionLogItems,
  shoppingLists,
  shoppingListItems,
  utcMidnightMs,
} from './nutritionQueries';
import type {
  AddMealEntryDTO,
  AddNutritionLogItemDTO,
  CreateFoodDTO,
  CreateMealPlanDTO,
  CreateRecipeDTO,
  CreateShoppingListDTO,
  Food,
  RecipeIngredientDTO,
  RecipeWithIngredients,
  UpdateFoodDTO,
  UpdateRecipeDTO,
} from '@horus/shared';

/**
 * Escrituras locales de nutrición (offline-first). Cada write termina con
 * `requestSync()` (push debounced 3s). Deletes de foods/recipes son SOFT
 * (is_active=false, como el REST); planes, logs y listas son hard delete
 * (markAsDeleted → tombstone en el server). Los hijos se borran explícitamente:
 * WatermelonDB no cascadea.
 */

// ─── Foods ────────────────────────────────────────────────────────────────────

export async function createFoodLocal(dto: CreateFoodDTO): Promise<Food> {
  const created = await database.write(async () => {
    return foods().create((f) => {
      f.name = dto.name;
      f.brand = dto.brand ?? undefined;
      f.calories = dto.calories;
      f.protein = dto.protein;
      f.carbs = dto.carbs;
      f.fat = dto.fat;
      f.fiber = dto.fiber ?? undefined;
      f.unit = dto.unit ?? 'g';
      f.isActive = true;
    });
  });
  requestSync();
  return toFood(created);
}

export async function updateFoodLocal(id: string, dto: UpdateFoodDTO): Promise<void> {
  await database.write(async () => {
    const food = await foods().find(id);
    await food.update((f) => {
      if (dto.name !== undefined) f.name = dto.name;
      if (dto.brand !== undefined) f.brand = dto.brand ?? undefined;
      if (dto.calories !== undefined) f.calories = dto.calories;
      if (dto.protein !== undefined) f.protein = dto.protein;
      if (dto.carbs !== undefined) f.carbs = dto.carbs;
      if (dto.fat !== undefined) f.fat = dto.fat;
      if (dto.fiber !== undefined) f.fiber = dto.fiber ?? undefined;
      if (dto.unit !== undefined) f.unit = dto.unit;
      if (dto.isActive !== undefined) f.isActive = dto.isActive;
    });
  });
  requestSync();
}

/** Soft delete (como el REST): la fila viaja como updated is_active=false. */
export async function deleteFoodLocal(id: string): Promise<void> {
  await database.write(async () => {
    const food = await foods().find(id);
    await food.update((f) => {
      f.isActive = false;
    });
  });
  requestSync();
}

// ─── Recipes ──────────────────────────────────────────────────────────────────

export async function createRecipeLocal(dto: CreateRecipeDTO): Promise<void> {
  await database.write(async () => {
    const recipe = await recipes().create((r) => {
      r.name = dto.name;
      r.description = dto.description ?? undefined;
      r.servings = dto.servings ?? 1;
      r.isActive = true;
    });
    for (const ing of dto.ingredients ?? []) {
      await recipeIngredients().create((i) => {
        i.recipeId = recipe.id;
        i.foodId = ing.foodId;
        i.grams = ing.grams;
        i.notes = ing.notes ?? undefined;
      });
    }
  });
  requestSync();
}

export async function updateRecipeLocal(id: string, dto: UpdateRecipeDTO): Promise<void> {
  await database.write(async () => {
    const recipe = await recipes().find(id);
    await recipe.update((r) => {
      if (dto.name !== undefined) r.name = dto.name;
      if (dto.description !== undefined) r.description = dto.description ?? undefined;
      if (dto.servings !== undefined) r.servings = dto.servings;
      if (dto.isActive !== undefined) r.isActive = dto.isActive;
    });
  });
  requestSync();
}

/** Soft delete (como el REST); los ingredientes quedan (la receta se oculta). */
export async function deleteRecipeLocal(id: string): Promise<void> {
  await database.write(async () => {
    const recipe = await recipes().find(id);
    await recipe.update((r) => {
      r.isActive = false;
    });
  });
  requestSync();
}

export async function addIngredientLocal(
  recipeId: string,
  dto: RecipeIngredientDTO
): Promise<RecipeWithIngredients> {
  await database.write(async () => {
    // Unique (recipeId, foodId) en el server: si ya existe, actualizar gramos
    const existing = await recipeIngredients()
      .query(Q.where('recipe_id', recipeId), Q.where('food_id', dto.foodId))
      .fetch();
    if (existing.length > 0) {
      await existing[0].update((i) => {
        i.grams = dto.grams;
        i.notes = dto.notes ?? undefined;
      });
      return;
    }
    await recipeIngredients().create((i) => {
      i.recipeId = recipeId;
      i.foodId = dto.foodId;
      i.grams = dto.grams;
      i.notes = dto.notes ?? undefined;
    });
  });
  requestSync();
  return getRecipeLocal(recipeId);
}

export async function removeIngredientLocal(ingredientId: string): Promise<void> {
  await database.write(async () => {
    const ingredient = await recipeIngredients().find(ingredientId);
    await ingredient.markAsDeleted();
  });
  requestSync();
}

// ─── Nutrition Logs ───────────────────────────────────────────────────────────

/** Busca o crea el log del día dentro de un write en curso. */
async function findOrCreateLog(date: string) {
  const ms = utcMidnightMs(date);
  const existing = await nutritionLogs().query(Q.where('date', ms)).fetch();
  if (existing.length > 0) return existing[0];
  return nutritionLogs().create((l) => {
    l.date = new Date(ms);
  });
}

export async function addLogItemLocal(date: string, item: AddNutritionLogItemDTO): Promise<void> {
  await database.write(async () => {
    const log = await findOrCreateLog(date);
    await nutritionLogItems().create((i) => {
      i.nutritionLogId = log.id;
      i.foodId = item.foodId ?? undefined;
      i.mealTime = item.mealTime;
      i.grams = item.grams;
      i.servings = item.servings ?? undefined;
      i.notes = item.notes ?? undefined;
    });
  });
  requestSync();
}

export async function removeLogItemLocal(itemId: string): Promise<void> {
  await database.write(async () => {
    const item = await nutritionLogItems().find(itemId);
    await item.markAsDeleted();
  });
  requestSync();
}

// ─── Meal Plans ───────────────────────────────────────────────────────────────

export async function createMealPlanLocal(dto: CreateMealPlanDTO): Promise<void> {
  await database.write(async () => {
    const ms = utcMidnightMs(dto.weekStart);
    // Unique (userId, weekStart): si ya existe el plan de esa semana, reusarlo
    const existing = await mealPlans().query(Q.where('week_start', ms)).fetch();
    if (existing.length > 0) {
      if (dto.notes !== undefined) {
        await existing[0].update((p) => {
          p.notes = dto.notes ?? undefined;
        });
      }
      return;
    }
    await mealPlans().create((p) => {
      p.weekStart = new Date(ms);
      p.notes = dto.notes ?? undefined;
    });
  });
  requestSync();
}

export async function deleteMealPlanLocal(id: string): Promise<void> {
  await database.write(async () => {
    const plan = await mealPlans().find(id);
    const entries = await mealEntries().query(Q.where('meal_plan_id', id)).fetch();
    if (entries.length > 0) {
      const items = await mealEntryItems()
        .query(Q.where('meal_entry_id', Q.oneOf(entries.map((e) => e.id))))
        .fetch();
      for (const item of items) await item.markAsDeleted();
      for (const entry of entries) await entry.markAsDeleted();
    }
    await plan.markAsDeleted();
  });
  requestSync();
}

export async function addMealEntryLocal(mealPlanId: string, dto: AddMealEntryDTO): Promise<void> {
  await database.write(async () => {
    const entry = await mealEntries().create((e) => {
      e.mealPlanId = mealPlanId;
      e.day = new Date(utcMidnightMs(dto.day));
      e.mealTime = dto.mealTime;
      e.notes = dto.notes ?? undefined;
    });
    for (const item of dto.items) {
      await mealEntryItems().create((i) => {
        i.mealEntryId = entry.id;
        i.foodId = item.foodId ?? undefined;
        i.recipeId = item.recipeId ?? undefined;
        i.grams = item.grams;
        i.servings = item.servings ?? undefined;
      });
    }
  });
  requestSync();
}

export async function removeMealEntryLocal(entryId: string): Promise<void> {
  await database.write(async () => {
    const entry = await mealEntries().find(entryId);
    const items = await mealEntryItems().query(Q.where('meal_entry_id', entryId)).fetch();
    for (const item of items) await item.markAsDeleted();
    await entry.markAsDeleted();
  });
  requestSync();
}

// ─── Shopping Lists ───────────────────────────────────────────────────────────

/** Agrega gramos por food del plan (espeja generateFromMealPlan del server):
 * foods directos suman sus grams; recetas expanden ingredientes escalados por
 * servings/receta.servings. */
async function aggregatePlanFoods(
  mealPlanId: string
): Promise<Array<{ foodId: string; name: string; quantity: number; unit: string }>> {
  const entries = await mealEntries().query(Q.where('meal_plan_id', mealPlanId)).fetch();
  if (entries.length === 0) return [];
  const items = await mealEntryItems()
    .query(Q.where('meal_entry_id', Q.oneOf(entries.map((e) => e.id))))
    .fetch();

  const totals = new Map<string, number>();
  const bump = (foodId: string, grams: number) =>
    totals.set(foodId, (totals.get(foodId) ?? 0) + grams);

  for (const item of items) {
    if (item.foodId) bump(item.foodId, item.grams);
    if (item.recipeId) {
      const recipe = await recipes()
        .find(item.recipeId)
        .catch(() => null);
      if (!recipe) continue;
      const ingredients = await recipeIngredients()
        .query(Q.where('recipe_id', item.recipeId))
        .fetch();
      const servings = item.servings ?? 1;
      const rs = recipe.servings || 1;
      for (const ing of ingredients) bump(ing.foodId, (ing.grams / rs) * servings);
    }
  }

  const result: Array<{ foodId: string; name: string; quantity: number; unit: string }> = [];
  for (const [foodId, grams] of totals) {
    const food = await foods()
      .find(foodId)
      .catch(() => null);
    if (!food) continue;
    result.push({ foodId, name: food.name, quantity: Math.ceil(grams), unit: food.unit });
  }
  return result;
}

export async function generateShoppingListLocal(mealPlanId: string, name: string): Promise<void> {
  const items = await aggregatePlanFoods(mealPlanId);
  await database.write(async () => {
    const list = await shoppingLists().create((l) => {
      l.mealPlanId = mealPlanId;
      l.name = name;
      l.generatedAt = new Date();
    });
    for (const item of items) {
      await shoppingListItems().create((i) => {
        i.shoppingListId = list.id;
        i.foodId = item.foodId;
        i.name = item.name;
        i.quantity = item.quantity;
        i.unit = item.unit;
        i.checked = false;
      });
    }
  });
  requestSync();
}

/** Regenera la lista vinculada al plan si existe (como el syncFromMealPlan del
 * REST tras editar entradas); si no hay lista vinculada, no hace nada. */
export async function syncShoppingListLocal(mealPlanId: string): Promise<void> {
  const linked = await shoppingLists().query(Q.where('meal_plan_id', mealPlanId)).fetch();
  if (linked.length === 0) return;
  const newItems = await aggregatePlanFoods(mealPlanId);

  await database.write(async () => {
    const list = linked[0];
    const oldItems = await shoppingListItems().query(Q.where('shopping_list_id', list.id)).fetch();
    for (const item of oldItems) await item.markAsDeleted();
    for (const item of newItems) {
      await shoppingListItems().create((i) => {
        i.shoppingListId = list.id;
        i.foodId = item.foodId;
        i.name = item.name;
        i.quantity = item.quantity;
        i.unit = item.unit;
        i.checked = false;
      });
    }
    await list.update((l) => {
      l.generatedAt = new Date();
    });
  });
  requestSync();
}

export async function createShoppingListLocal(dto: CreateShoppingListDTO): Promise<void> {
  await database.write(async () => {
    const list = await shoppingLists().create((l) => {
      l.mealPlanId = dto.mealPlanId ?? undefined;
      l.name = dto.name;
    });
    for (const item of dto.items ?? []) {
      await shoppingListItems().create((i) => {
        i.shoppingListId = list.id;
        i.foodId = item.foodId ?? undefined;
        i.name = item.name;
        i.quantity = item.quantity;
        i.unit = item.unit;
        i.checked = false;
        i.notes = item.notes ?? undefined;
      });
    }
  });
  requestSync();
}

export async function deleteShoppingListLocal(id: string): Promise<void> {
  await database.write(async () => {
    const list = await shoppingLists().find(id);
    const items = await shoppingListItems().query(Q.where('shopping_list_id', id)).fetch();
    for (const item of items) await item.markAsDeleted();
    await list.markAsDeleted();
  });
  requestSync();
}

export async function checkShoppingItemLocal(itemId: string, checked: boolean): Promise<void> {
  await database.write(async () => {
    const item = await shoppingListItems().find(itemId);
    await item.update((i) => {
      i.checked = checked;
    });
  });
  requestSync();
}

export async function linkTransactionLocal(listId: string, transactionId: string): Promise<void> {
  await database.write(async () => {
    const list = await shoppingLists().find(listId);
    await list.update((l) => {
      l.transactionId = transactionId;
    });
  });
  requestSync();
}
