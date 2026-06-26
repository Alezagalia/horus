import { axiosInstance } from '../axios';
import type {
  Food,
  FoodFilters,
  CreateFoodDTO,
  UpdateFoodDTO,
  NutritionLog,
  UpdateNutritionLogDTO,
  AddNutritionLogItemDTO,
  RecipeWithIngredients,
  CreateRecipeDTO,
  UpdateRecipeDTO,
  RecipeIngredientDTO,
  MealPlanWithEntries,
  CreateMealPlanDTO,
  AddMealEntryDTO,
  DayMacros,
  ShoppingList,
  CreateShoppingListDTO,
} from '@horus/shared';

export const nutritionApi = {
  // ─── Foods ───────────────────────────────────────────────────────────────────

  listFoods: async (filters?: FoodFilters): Promise<Food[]> => {
    const { data } = await axiosInstance.get('/foods', { params: filters });
    return data.foods ?? [];
  },

  createFood: async (dto: CreateFoodDTO): Promise<Food> => {
    const { data } = await axiosInstance.post('/foods', dto);
    return data.food ?? data;
  },

  updateFood: async (id: string, dto: UpdateFoodDTO): Promise<Food> => {
    const { data } = await axiosInstance.put(`/foods/${id}`, dto);
    return data.food ?? data;
  },

  deleteFood: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/foods/${id}`);
  },

  // ─── Nutrition Logs ───────────────────────────────────────────────────────────

  getLog: async (date: string): Promise<NutritionLog | null> => {
    const { data } = await axiosInstance.get(`/nutrition-logs/${date}`);
    return data.log ?? null;
  },

  upsertLog: async (date: string, dto: UpdateNutritionLogDTO): Promise<NutritionLog> => {
    const { data } = await axiosInstance.put(`/nutrition-logs/${date}`, dto);
    return data.log ?? data;
  },

  addLogItem: async (date: string, item: AddNutritionLogItemDTO): Promise<NutritionLog> => {
    // upsert with the new item appended to current log
    const current = await nutritionApi.getLog(date);
    const existingItems =
      current?.items.map((i) => ({
        foodId: i.foodId,
        mealTime: i.mealTime,
        grams: i.grams,
        servings: i.servings,
        notes: i.notes,
      })) ?? [];
    return nutritionApi.upsertLog(date, { items: [...existingItems, item] });
  },

  removeLogItem: async (date: string, itemId: string): Promise<NutritionLog> => {
    const current = await nutritionApi.getLog(date);
    const items =
      current?.items
        .filter((i) => i.id !== itemId)
        .map((i) => ({
          foodId: i.foodId,
          mealTime: i.mealTime,
          grams: i.grams,
          servings: i.servings,
          notes: i.notes,
        })) ?? [];
    return nutritionApi.upsertLog(date, { items });
  },

  // ─── Recipes ──────────────────────────────────────────────────────────────────

  listRecipes: async (): Promise<RecipeWithIngredients[]> => {
    const { data } = await axiosInstance.get('/recipes');
    return data.recipes ?? [];
  },

  createRecipe: async (dto: CreateRecipeDTO): Promise<RecipeWithIngredients> => {
    const { data } = await axiosInstance.post('/recipes', dto);
    return data.recipe ?? data;
  },

  updateRecipe: async (id: string, dto: UpdateRecipeDTO): Promise<RecipeWithIngredients> => {
    const { data } = await axiosInstance.put(`/recipes/${id}`, dto);
    return data.recipe ?? data;
  },

  deleteRecipe: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/recipes/${id}`);
  },

  addIngredient: async (
    recipeId: string,
    dto: RecipeIngredientDTO
  ): Promise<RecipeWithIngredients> => {
    const { data } = await axiosInstance.post(`/recipes/${recipeId}/ingredients`, dto);
    return data.recipe ?? data;
  },

  removeIngredient: async (recipeId: string, ingredientId: string): Promise<void> => {
    await axiosInstance.delete(`/recipes/${recipeId}/ingredients/${ingredientId}`);
  },

  // ─── Meal Plans ───────────────────────────────────────────────────────────────

  getMealPlanByWeek: async (weekStart: string): Promise<MealPlanWithEntries | null> => {
    const { data } = await axiosInstance.get('/meal-plans/by-week', { params: { weekStart } });
    return data.mealPlan ?? null;
  },

  createMealPlan: async (dto: CreateMealPlanDTO): Promise<MealPlanWithEntries> => {
    const { data } = await axiosInstance.post('/meal-plans', dto);
    return data.mealPlan ?? data;
  },

  deleteMealPlan: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/meal-plans/${id}`);
  },

  addMealEntry: async (mealPlanId: string, dto: AddMealEntryDTO): Promise<MealPlanWithEntries> => {
    const { data } = await axiosInstance.post(`/meal-plans/${mealPlanId}/entries`, dto);
    return data.mealPlan ?? data;
  },

  removeMealEntry: async (mealPlanId: string, entryId: string): Promise<void> => {
    await axiosInstance.delete(`/meal-plans/${mealPlanId}/entries/${entryId}`);
  },

  getMealPlanMacros: async (mealPlanId: string): Promise<DayMacros[]> => {
    const { data } = await axiosInstance.get(`/meal-plans/${mealPlanId}/macros`);
    return data.dayMacros ?? [];
  },

  generateShoppingList: async (mealPlanId: string, name: string): Promise<ShoppingList> => {
    const { data } = await axiosInstance.post(`/meal-plans/${mealPlanId}/shopping-list`, { name });
    return data.shoppingList ?? data;
  },

  syncShoppingList: async (mealPlanId: string): Promise<ShoppingList> => {
    const { data } = await axiosInstance.put(`/meal-plans/${mealPlanId}/shopping-list`);
    return data.shoppingList ?? data;
  },

  // ─── Shopping Lists ─────────────────────────────────────────────────────────────

  listShoppingLists: async (): Promise<ShoppingList[]> => {
    const { data } = await axiosInstance.get('/shopping-lists');
    return data.shoppingLists ?? [];
  },

  createShoppingList: async (dto: CreateShoppingListDTO): Promise<ShoppingList> => {
    const { data } = await axiosInstance.post('/shopping-lists', dto);
    return data.shoppingList ?? data;
  },

  deleteShoppingList: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/shopping-lists/${id}`);
  },

  checkShoppingItem: async (
    listId: string,
    itemId: string,
    checked: boolean
  ): Promise<ShoppingList> => {
    const { data } = await axiosInstance.patch(`/shopping-lists/${listId}/items/${itemId}`, {
      checked,
    });
    return data.shoppingList ?? data;
  },

  linkTransaction: async (listId: string, transactionId: string): Promise<ShoppingList> => {
    const { data } = await axiosInstance.post(`/shopping-lists/${listId}/link-transaction`, {
      transactionId,
    });
    return data.shoppingList ?? data;
  },
};
