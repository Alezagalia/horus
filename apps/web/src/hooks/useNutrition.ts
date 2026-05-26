/**
 * Nutrition Hooks - F-17
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getFoods,
  getFood,
  createFood,
  updateFood,
  deleteFood,
  getRecipes,
  getRecipe,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  addIngredient,
  removeIngredient,
  getMealPlans,
  getMealPlan,
  getMealPlanByWeek,
  createMealPlan,
  deleteMealPlan,
  addMealEntry,
  deleteMealEntry,
  getMealPlanMacros,
  generateShoppingListFromPlan,
  getNutritionLog,
  getNutritionLogs,
  upsertNutritionLog,
  getShoppingLists,
  getShoppingList,
  createShoppingList,
  deleteShoppingList,
  checkShoppingItem,
  linkTransactionToList,
  nutritionKeys,
} from '@/services/api/nutritionApi';
import type {
  CreateFoodDTO,
  UpdateFoodDTO,
  FoodFilters,
  CreateRecipeDTO,
  UpdateRecipeDTO,
  RecipeIngredientDTO,
  CreateMealPlanDTO,
  AddMealEntryDTO,
  UpdateNutritionLogDTO,
  CreateShoppingListDTO,
  LinkTransactionDTO,
} from '@horus/shared';

// ─── Foods ────────────────────────────────────────────────────────────────────

export function useFoods(filters?: FoodFilters) {
  return useQuery({
    queryKey: nutritionKeys.foods.list(filters),
    queryFn: () => getFoods(filters),
  });
}

export function useFood(id: string) {
  return useQuery({
    queryKey: ['foods', id],
    queryFn: () => getFood(id),
    enabled: Boolean(id),
  });
}

export function useCreateFood() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateFoodDTO) => createFood(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nutritionKeys.foods.all });
    },
  });
}

export function useUpdateFood() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFoodDTO }) => updateFood(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nutritionKeys.foods.all });
    },
  });
}

export function useDeleteFood() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteFood(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nutritionKeys.foods.all });
    },
  });
}

// ─── Recipes ──────────────────────────────────────────────────────────────────

export function useRecipes() {
  return useQuery({
    queryKey: nutritionKeys.recipes.list(),
    queryFn: () => getRecipes(),
  });
}

export function useRecipe(id: string) {
  return useQuery({
    queryKey: nutritionKeys.recipes.detail(id),
    queryFn: () => getRecipe(id),
    enabled: Boolean(id),
  });
}

export function useCreateRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRecipeDTO) => createRecipe(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nutritionKeys.recipes.all });
    },
  });
}

export function useUpdateRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRecipeDTO }) => updateRecipe(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: nutritionKeys.recipes.all });
      qc.invalidateQueries({ queryKey: nutritionKeys.recipes.detail(id) });
    },
  });
}

export function useDeleteRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteRecipe(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nutritionKeys.recipes.all });
    },
  });
}

export function useAddIngredient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ recipeId, data }: { recipeId: string; data: RecipeIngredientDTO }) =>
      addIngredient(recipeId, data),
    onSuccess: (_, { recipeId }) => {
      qc.invalidateQueries({ queryKey: nutritionKeys.recipes.detail(recipeId) });
      qc.invalidateQueries({ queryKey: nutritionKeys.recipes.list() });
    },
  });
}

export function useRemoveIngredient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ recipeId, ingredientId }: { recipeId: string; ingredientId: string }) =>
      removeIngredient(recipeId, ingredientId),
    onSuccess: (_, { recipeId }) => {
      qc.invalidateQueries({ queryKey: nutritionKeys.recipes.detail(recipeId) });
      qc.invalidateQueries({ queryKey: nutritionKeys.recipes.list() });
    },
  });
}

// ─── MealPlans ────────────────────────────────────────────────────────────────

export function useMealPlans() {
  return useQuery({
    queryKey: nutritionKeys.mealPlans.list(),
    queryFn: () => getMealPlans(),
  });
}

export function useMealPlan(id: string) {
  return useQuery({
    queryKey: nutritionKeys.mealPlans.detail(id),
    queryFn: () => getMealPlan(id),
    enabled: Boolean(id),
  });
}

export function useMealPlanByWeek(weekStart: string) {
  return useQuery({
    queryKey: nutritionKeys.mealPlans.week(weekStart),
    queryFn: () => getMealPlanByWeek(weekStart),
    enabled: Boolean(weekStart),
  });
}

export function useMealPlanMacros(mealPlanId: string) {
  return useQuery({
    queryKey: nutritionKeys.mealPlans.macros(mealPlanId),
    queryFn: () => getMealPlanMacros(mealPlanId),
    enabled: Boolean(mealPlanId),
  });
}

export function useCreateMealPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMealPlanDTO) => createMealPlan(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nutritionKeys.mealPlans.all });
    },
  });
}

export function useDeleteMealPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteMealPlan(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nutritionKeys.mealPlans.all });
    },
  });
}

export function useAddMealEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ mealPlanId, data }: { mealPlanId: string; data: AddMealEntryDTO }) =>
      addMealEntry(mealPlanId, data),
    onSuccess: (_, { mealPlanId }) => {
      qc.invalidateQueries({ queryKey: nutritionKeys.mealPlans.detail(mealPlanId) });
      qc.invalidateQueries({ queryKey: nutritionKeys.mealPlans.macros(mealPlanId) });
    },
  });
}

export function useDeleteMealEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ mealPlanId, entryId }: { mealPlanId: string; entryId: string }) =>
      deleteMealEntry(mealPlanId, entryId),
    onSuccess: (_, { mealPlanId }) => {
      qc.invalidateQueries({ queryKey: nutritionKeys.mealPlans.detail(mealPlanId) });
      qc.invalidateQueries({ queryKey: nutritionKeys.mealPlans.macros(mealPlanId) });
    },
  });
}

export function useGenerateShoppingList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ mealPlanId, name }: { mealPlanId: string; name: string }) =>
      generateShoppingListFromPlan(mealPlanId, name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nutritionKeys.shoppingLists.all });
    },
  });
}

// ─── NutritionLog ─────────────────────────────────────────────────────────────

export function useNutritionLog(date: string) {
  return useQuery({
    queryKey: nutritionKeys.nutritionLog.date(date),
    queryFn: () => getNutritionLog(date),
    enabled: Boolean(date),
  });
}

export function useNutritionLogs(params?: { from?: string; to?: string }) {
  return useQuery({
    queryKey: nutritionKeys.nutritionLog.range(params?.from, params?.to),
    queryFn: () => getNutritionLogs(params),
  });
}

export function useUpsertNutritionLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ date, data }: { date: string; data: UpdateNutritionLogDTO }) =>
      upsertNutritionLog(date, data),
    onSuccess: (_, { date }) => {
      qc.invalidateQueries({ queryKey: nutritionKeys.nutritionLog.date(date) });
      qc.invalidateQueries({ queryKey: nutritionKeys.nutritionLog.all });
    },
  });
}

// ─── ShoppingLists ────────────────────────────────────────────────────────────

export function useShoppingLists() {
  return useQuery({
    queryKey: nutritionKeys.shoppingLists.list(),
    queryFn: () => getShoppingLists(),
  });
}

export function useShoppingList(id: string) {
  return useQuery({
    queryKey: nutritionKeys.shoppingLists.detail(id),
    queryFn: () => getShoppingList(id),
    enabled: Boolean(id),
  });
}

export function useCreateShoppingList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateShoppingListDTO) => createShoppingList(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nutritionKeys.shoppingLists.all });
    },
  });
}

export function useDeleteShoppingList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteShoppingList(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nutritionKeys.shoppingLists.all });
    },
  });
}

export function useCheckShoppingItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      listId,
      itemId,
      checked,
    }: {
      listId: string;
      itemId: string;
      checked: boolean;
    }) => checkShoppingItem(listId, itemId, checked),
    onSuccess: (_, { listId }) => {
      qc.invalidateQueries({ queryKey: nutritionKeys.shoppingLists.detail(listId) });
    },
  });
}

export function useLinkTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ listId, data }: { listId: string; data: LinkTransactionDTO }) =>
      linkTransactionToList(listId, data),
    onSuccess: (_, { listId }) => {
      qc.invalidateQueries({ queryKey: nutritionKeys.shoppingLists.detail(listId) });
    },
  });
}
