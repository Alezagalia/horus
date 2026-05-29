/**
 * Nutrition API Service - F-17
 */

import { axiosInstance } from '@/lib/axios';
import type {
  Food,
  CreateFoodDTO,
  UpdateFoodDTO,
  FoodFilters,
  RecipeWithIngredients,
  CreateRecipeDTO,
  UpdateRecipeDTO,
  RecipeIngredientDTO,
  MealPlan,
  MealPlanWithEntries,
  CreateMealPlanDTO,
  AddMealEntryDTO,
  DayMacros,
  NutritionLog,
  UpdateNutritionLogDTO,
  ShoppingList,
  CreateShoppingListDTO,
  LinkTransactionDTO,
} from '@horus/shared';

// ─── Foods ────────────────────────────────────────────────────────────────────

export async function getFoods(filters?: FoodFilters): Promise<Food[]> {
  const response = await axiosInstance.get<{ foods: Food[] }>('/foods', { params: filters });
  return response.data.foods;
}

export async function getFood(id: string): Promise<Food> {
  const response = await axiosInstance.get<{ food: Food }>(`/foods/${id}`);
  return response.data.food;
}

export async function createFood(data: CreateFoodDTO): Promise<Food> {
  const response = await axiosInstance.post<{ food: Food }>('/foods', data);
  return response.data.food;
}

export async function updateFood(id: string, data: UpdateFoodDTO): Promise<Food> {
  const response = await axiosInstance.put<{ food: Food }>(`/foods/${id}`, data);
  return response.data.food;
}

export async function deleteFood(id: string): Promise<void> {
  await axiosInstance.delete(`/foods/${id}`);
}

// ─── Recipes ──────────────────────────────────────────────────────────────────

export async function getRecipes(): Promise<RecipeWithIngredients[]> {
  const response = await axiosInstance.get<{ recipes: RecipeWithIngredients[] }>('/recipes');
  return response.data.recipes;
}

export async function getRecipe(id: string): Promise<RecipeWithIngredients> {
  const response = await axiosInstance.get<{ recipe: RecipeWithIngredients }>(`/recipes/${id}`);
  return response.data.recipe;
}

export async function createRecipe(data: CreateRecipeDTO): Promise<RecipeWithIngredients> {
  const response = await axiosInstance.post<{ recipe: RecipeWithIngredients }>('/recipes', data);
  return response.data.recipe;
}

export async function updateRecipe(
  id: string,
  data: UpdateRecipeDTO
): Promise<RecipeWithIngredients> {
  const response = await axiosInstance.put<{ recipe: RecipeWithIngredients }>(
    `/recipes/${id}`,
    data
  );
  return response.data.recipe;
}

export async function deleteRecipe(id: string): Promise<void> {
  await axiosInstance.delete(`/recipes/${id}`);
}

export async function addIngredient(
  recipeId: string,
  data: RecipeIngredientDTO
): Promise<RecipeWithIngredients> {
  const response = await axiosInstance.post<{ recipe: RecipeWithIngredients }>(
    `/recipes/${recipeId}/ingredients`,
    data
  );
  return response.data.recipe;
}

export async function removeIngredient(recipeId: string, ingredientId: string): Promise<void> {
  await axiosInstance.delete(`/recipes/${recipeId}/ingredients/${ingredientId}`);
}

// ─── MealPlans ────────────────────────────────────────────────────────────────

export async function getMealPlans(): Promise<MealPlan[]> {
  const response = await axiosInstance.get<{ mealPlans: MealPlan[] }>('/meal-plans');
  return response.data.mealPlans;
}

export async function getMealPlan(id: string): Promise<MealPlanWithEntries> {
  const response = await axiosInstance.get<{ mealPlan: MealPlanWithEntries }>(`/meal-plans/${id}`);
  return response.data.mealPlan;
}

export async function getMealPlanByWeek(weekStart: string): Promise<MealPlanWithEntries | null> {
  const response = await axiosInstance.get<{ mealPlan: MealPlanWithEntries | null }>(
    '/meal-plans/by-week',
    { params: { weekStart } }
  );
  return response.data.mealPlan;
}

export async function createMealPlan(data: CreateMealPlanDTO): Promise<MealPlanWithEntries> {
  const response = await axiosInstance.post<{ mealPlan: MealPlanWithEntries }>('/meal-plans', data);
  return response.data.mealPlan;
}

export async function deleteMealPlan(id: string): Promise<void> {
  await axiosInstance.delete(`/meal-plans/${id}`);
}

export async function addMealEntry(
  mealPlanId: string,
  data: AddMealEntryDTO
): Promise<MealPlanWithEntries> {
  const response = await axiosInstance.post<{ mealPlan: MealPlanWithEntries }>(
    `/meal-plans/${mealPlanId}/entries`,
    data
  );
  return response.data.mealPlan;
}

export async function deleteMealEntry(mealPlanId: string, entryId: string): Promise<void> {
  await axiosInstance.delete(`/meal-plans/${mealPlanId}/entries/${entryId}`);
}

export async function getMealPlanMacros(mealPlanId: string): Promise<DayMacros[]> {
  const response = await axiosInstance.get<{ dayMacros: DayMacros[] }>(
    `/meal-plans/${mealPlanId}/macros`
  );
  return response.data.dayMacros;
}

export async function generateShoppingListFromPlan(
  mealPlanId: string,
  name: string
): Promise<ShoppingList> {
  const response = await axiosInstance.post<{ shoppingList: ShoppingList }>(
    `/meal-plans/${mealPlanId}/shopping-list`,
    { name }
  );
  return response.data.shoppingList;
}

export async function syncShoppingListFromPlan(mealPlanId: string): Promise<ShoppingList> {
  const response = await axiosInstance.put<{ shoppingList: ShoppingList }>(
    `/meal-plans/${mealPlanId}/shopping-list`
  );
  return response.data.shoppingList;
}

// ─── NutritionLogs ────────────────────────────────────────────────────────────

export async function getNutritionLogs(params?: {
  from?: string;
  to?: string;
}): Promise<NutritionLog[]> {
  const response = await axiosInstance.get<{ logs: NutritionLog[] }>('/nutrition-logs', { params });
  return response.data.logs;
}

export async function getNutritionLog(date: string): Promise<NutritionLog | null> {
  const response = await axiosInstance.get<{ log: NutritionLog | null }>(`/nutrition-logs/${date}`);
  return response.data.log;
}

export async function upsertNutritionLog(
  date: string,
  data: UpdateNutritionLogDTO
): Promise<NutritionLog> {
  const response = await axiosInstance.put<{ log: NutritionLog }>(`/nutrition-logs/${date}`, data);
  return response.data.log;
}

export async function deleteNutritionLog(date: string): Promise<void> {
  await axiosInstance.delete(`/nutrition-logs/${date}`);
}

// ─── ShoppingLists ────────────────────────────────────────────────────────────

export async function getShoppingLists(): Promise<ShoppingList[]> {
  const response = await axiosInstance.get<{ shoppingLists: ShoppingList[] }>('/shopping-lists');
  return response.data.shoppingLists;
}

export async function getShoppingList(id: string): Promise<ShoppingList> {
  const response = await axiosInstance.get<{ shoppingList: ShoppingList }>(`/shopping-lists/${id}`);
  return response.data.shoppingList;
}

export async function createShoppingList(data: CreateShoppingListDTO): Promise<ShoppingList> {
  const response = await axiosInstance.post<{ shoppingList: ShoppingList }>(
    '/shopping-lists',
    data
  );
  return response.data.shoppingList;
}

export async function deleteShoppingList(id: string): Promise<void> {
  await axiosInstance.delete(`/shopping-lists/${id}`);
}

export async function checkShoppingItem(
  listId: string,
  itemId: string,
  checked: boolean
): Promise<ShoppingList> {
  const response = await axiosInstance.patch<{ shoppingList: ShoppingList }>(
    `/shopping-lists/${listId}/items/${itemId}`,
    { checked }
  );
  return response.data.shoppingList;
}

export async function linkTransactionToList(
  listId: string,
  data: LinkTransactionDTO
): Promise<ShoppingList> {
  const response = await axiosInstance.post<{ shoppingList: ShoppingList }>(
    `/shopping-lists/${listId}/link-transaction`,
    data
  );
  return response.data.shoppingList;
}

// ─── Cache keys ───────────────────────────────────────────────────────────────

export const nutritionKeys = {
  foods: {
    all: ['foods'] as const,
    list: (filters?: FoodFilters) => ['foods', 'list', filters] as const,
  },
  recipes: {
    all: ['recipes'] as const,
    list: () => ['recipes', 'list'] as const,
    detail: (id: string) => ['recipes', id] as const,
  },
  mealPlans: {
    all: ['meal-plans'] as const,
    list: () => ['meal-plans', 'list'] as const,
    week: (w: string) => ['meal-plans', 'week', w] as const,
    detail: (id: string) => ['meal-plans', id] as const,
    macros: (id: string) => ['meal-plans', id, 'macros'] as const,
  },
  nutritionLog: {
    all: ['nutrition-log'] as const,
    date: (d: string) => ['nutrition-log', d] as const,
    range: (from?: string, to?: string) => ['nutrition-log', 'range', from, to] as const,
  },
  shoppingLists: {
    all: ['shopping-lists'] as const,
    list: () => ['shopping-lists', 'list'] as const,
    detail: (id: string) => ['shopping-lists', id] as const,
  },
};
