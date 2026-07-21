import { useMutation } from '@tanstack/react-query';
import { useWatermelonQuery } from './useWatermelonQuery';
import {
  listFoodsLocal,
  getNutritionLogLocal,
  listRecipesLocal,
  getMealPlanByWeekLocal,
  getMealPlanMacrosLocal,
  listShoppingListsLocal,
} from '@/db/nutritionQueries';
import {
  createFoodLocal,
  updateFoodLocal,
  deleteFoodLocal,
  addLogItemLocal,
  removeLogItemLocal,
  createRecipeLocal,
  updateRecipeLocal,
  deleteRecipeLocal,
  addIngredientLocal,
  removeIngredientLocal,
  createMealPlanLocal,
  addMealEntryLocal,
  removeMealEntryLocal,
  generateShoppingListLocal,
  syncShoppingListLocal,
  createShoppingListLocal,
  deleteShoppingListLocal,
  checkShoppingItemLocal,
  linkTransactionLocal,
} from '@/db/nutritionWrites';
import type {
  FoodFilters,
  CreateFoodDTO,
  UpdateFoodDTO,
  AddNutritionLogItemDTO,
  CreateRecipeDTO,
  UpdateRecipeDTO,
  RecipeIngredientDTO,
  CreateMealPlanDTO,
  AddMealEntryDTO,
  CreateShoppingListDTO,
} from '@horus/shared';

/**
 * Nutrición offline-first: lecturas desde SQLite local (useWatermelonQuery,
 * reactividad por withChangesForTables) y escrituras locales que disparan el
 * sync. Mismas keys y firmas que la versión REST: la UI no cambia.
 */

export const nutritionKeys = {
  all: ['nutrition'] as const,
  foods: (filters?: FoodFilters) => [...nutritionKeys.all, 'foods', filters] as const,
  log: (date: string) => [...nutritionKeys.all, 'log', date] as const,
  recipes: () => [...nutritionKeys.all, 'recipes'] as const,
  mealPlanWeek: (weekStart: string) => [...nutritionKeys.all, 'mealPlan', weekStart] as const,
  mealPlanMacros: (id: string) => [...nutritionKeys.all, 'mealPlanMacros', id] as const,
  shoppingLists: () => [...nutritionKeys.all, 'shoppingLists'] as const,
};

const RECIPE_TABLES = ['recipes', 'recipe_ingredients', 'foods'];
const PLAN_TABLES = ['meal_plans', 'meal_entries', 'meal_entry_items', ...RECIPE_TABLES];

// ─── Foods ────────────────────────────────────────────────────────────────────

export function useFoods(filters?: FoodFilters) {
  return useWatermelonQuery(nutritionKeys.foods(filters), () => listFoodsLocal(filters), ['foods']);
}

export function useCreateFood() {
  return useMutation({ mutationFn: (dto: CreateFoodDTO) => createFoodLocal(dto) });
}

export function useUpdateFood() {
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateFoodDTO }) => updateFoodLocal(id, dto),
  });
}

export function useDeleteFood() {
  return useMutation({ mutationFn: (id: string) => deleteFoodLocal(id) });
}

// ─── Nutrition Log ────────────────────────────────────────────────────────────

export function useNutritionLog(date: string) {
  return useWatermelonQuery(nutritionKeys.log(date), () => getNutritionLogLocal(date), [
    'nutrition_logs',
    'nutrition_log_items',
    'foods',
  ]);
}

export function useAddLogItem() {
  return useMutation({
    mutationFn: ({ date, item }: { date: string; item: AddNutritionLogItemDTO }) =>
      addLogItemLocal(date, item),
  });
}

export function useRemoveLogItem() {
  return useMutation({
    mutationFn: ({ itemId }: { date: string; itemId: string }) => removeLogItemLocal(itemId),
  });
}

// ─── Recipes ──────────────────────────────────────────────────────────────────

export function useRecipes() {
  return useWatermelonQuery(nutritionKeys.recipes(), () => listRecipesLocal(), RECIPE_TABLES);
}

export function useCreateRecipe() {
  return useMutation({ mutationFn: (dto: CreateRecipeDTO) => createRecipeLocal(dto) });
}

export function useUpdateRecipe() {
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateRecipeDTO }) => updateRecipeLocal(id, dto),
  });
}

export function useDeleteRecipe() {
  return useMutation({ mutationFn: (id: string) => deleteRecipeLocal(id) });
}

export function useAddIngredient() {
  return useMutation({
    mutationFn: ({ recipeId, dto }: { recipeId: string; dto: RecipeIngredientDTO }) =>
      addIngredientLocal(recipeId, dto),
  });
}

export function useRemoveIngredient() {
  return useMutation({
    mutationFn: ({ ingredientId }: { recipeId: string; ingredientId: string }) =>
      removeIngredientLocal(ingredientId),
  });
}

// ─── Meal Plans ───────────────────────────────────────────────────────────────

export function useMealPlanByWeek(weekStart: string) {
  return useWatermelonQuery(
    nutritionKeys.mealPlanWeek(weekStart),
    () => getMealPlanByWeekLocal(weekStart),
    PLAN_TABLES
  );
}

export function useMealPlanMacros(mealPlanId: string | undefined) {
  return useWatermelonQuery(
    nutritionKeys.mealPlanMacros(mealPlanId ?? ''),
    () => (mealPlanId ? getMealPlanMacrosLocal(mealPlanId) : Promise.resolve([])),
    PLAN_TABLES
  );
}

export function useCreateMealPlan() {
  return useMutation({ mutationFn: (dto: CreateMealPlanDTO) => createMealPlanLocal(dto) });
}

export function useAddMealEntry() {
  return useMutation({
    mutationFn: async ({ mealPlanId, dto }: { mealPlanId: string; dto: AddMealEntryDTO }) => {
      await addMealEntryLocal(mealPlanId, dto);
      // Regenera la lista de compras vinculada si existe (igual que la web)
      await syncShoppingListLocal(mealPlanId);
    },
  });
}

export function useRemoveMealEntry() {
  return useMutation({
    mutationFn: async ({ mealPlanId, entryId }: { mealPlanId: string; entryId: string }) => {
      await removeMealEntryLocal(entryId);
      await syncShoppingListLocal(mealPlanId);
    },
  });
}

export function useGenerateShoppingList() {
  return useMutation({
    mutationFn: ({ mealPlanId, name }: { mealPlanId: string; name: string }) =>
      generateShoppingListLocal(mealPlanId, name),
  });
}

// ─── Shopping Lists ───────────────────────────────────────────────────────────

export function useShoppingLists() {
  return useWatermelonQuery(nutritionKeys.shoppingLists(), () => listShoppingListsLocal(), [
    'shopping_lists',
    'shopping_list_items',
    'foods',
  ]);
}

export function useCreateShoppingList() {
  return useMutation({
    mutationFn: (dto: CreateShoppingListDTO) => createShoppingListLocal(dto),
  });
}

export function useDeleteShoppingList() {
  return useMutation({ mutationFn: (id: string) => deleteShoppingListLocal(id) });
}

export function useCheckShoppingItem() {
  return useMutation({
    mutationFn: ({ itemId, checked }: { listId: string; itemId: string; checked: boolean }) =>
      checkShoppingItemLocal(itemId, checked),
  });
}

export function useLinkTransaction() {
  return useMutation({
    mutationFn: ({ listId, transactionId }: { listId: string; transactionId: string }) =>
      linkTransactionLocal(listId, transactionId),
  });
}
