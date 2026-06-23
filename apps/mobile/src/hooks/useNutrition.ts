import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { nutritionApi } from '@/services/api/nutritionApi';
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

export const nutritionKeys = {
  all: ['nutrition'] as const,
  foods: (filters?: FoodFilters) => [...nutritionKeys.all, 'foods', filters] as const,
  log: (date: string) => [...nutritionKeys.all, 'log', date] as const,
  recipes: () => [...nutritionKeys.all, 'recipes'] as const,
  mealPlanWeek: (weekStart: string) => [...nutritionKeys.all, 'mealPlan', weekStart] as const,
  mealPlanMacros: (id: string) => [...nutritionKeys.all, 'mealPlanMacros', id] as const,
  shoppingLists: () => [...nutritionKeys.all, 'shoppingLists'] as const,
};

// ─── Foods ────────────────────────────────────────────────────────────────────

export function useFoods(filters?: FoodFilters) {
  return useQuery({
    queryKey: nutritionKeys.foods(filters),
    queryFn: () => nutritionApi.listFoods(filters),
    staleTime: 1000 * 60 * 10,
  });
}

export function useCreateFood() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateFoodDTO) => nutritionApi.createFood(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...nutritionKeys.all, 'foods'] }),
  });
}

export function useUpdateFood() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateFoodDTO }) =>
      nutritionApi.updateFood(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...nutritionKeys.all, 'foods'] }),
  });
}

export function useDeleteFood() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => nutritionApi.deleteFood(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...nutritionKeys.all, 'foods'] }),
  });
}

// ─── Nutrition Log ────────────────────────────────────────────────────────────

export function useNutritionLog(date: string) {
  return useQuery({
    queryKey: nutritionKeys.log(date),
    queryFn: () => nutritionApi.getLog(date),
    staleTime: 1000 * 60 * 2,
  });
}

export function useAddLogItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ date, item }: { date: string; item: AddNutritionLogItemDTO }) =>
      nutritionApi.addLogItem(date, item),
    onSuccess: (log) => qc.invalidateQueries({ queryKey: nutritionKeys.log(log.date) }),
  });
}

export function useRemoveLogItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ date, itemId }: { date: string; itemId: string }) =>
      nutritionApi.removeLogItem(date, itemId),
    onSuccess: (log) => qc.invalidateQueries({ queryKey: nutritionKeys.log(log.date) }),
  });
}

// ─── Recipes ──────────────────────────────────────────────────────────────────

export function useRecipes() {
  return useQuery({
    queryKey: nutritionKeys.recipes(),
    queryFn: () => nutritionApi.listRecipes(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateRecipeDTO) => nutritionApi.createRecipe(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: nutritionKeys.recipes() }),
  });
}

export function useUpdateRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateRecipeDTO }) =>
      nutritionApi.updateRecipe(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: nutritionKeys.recipes() }),
  });
}

export function useDeleteRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => nutritionApi.deleteRecipe(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: nutritionKeys.recipes() }),
  });
}

export function useAddIngredient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ recipeId, dto }: { recipeId: string; dto: RecipeIngredientDTO }) =>
      nutritionApi.addIngredient(recipeId, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: nutritionKeys.recipes() }),
  });
}

export function useRemoveIngredient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ recipeId, ingredientId }: { recipeId: string; ingredientId: string }) =>
      nutritionApi.removeIngredient(recipeId, ingredientId),
    onSuccess: () => qc.invalidateQueries({ queryKey: nutritionKeys.recipes() }),
  });
}

// ─── Meal Plans ───────────────────────────────────────────────────────────────

export function useMealPlanByWeek(weekStart: string) {
  return useQuery({
    queryKey: nutritionKeys.mealPlanWeek(weekStart),
    queryFn: () => nutritionApi.getMealPlanByWeek(weekStart),
    staleTime: 1000 * 60 * 2,
  });
}

export function useMealPlanMacros(mealPlanId: string | undefined) {
  return useQuery({
    queryKey: nutritionKeys.mealPlanMacros(mealPlanId ?? ''),
    queryFn: () => nutritionApi.getMealPlanMacros(mealPlanId!),
    enabled: !!mealPlanId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateMealPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateMealPlanDTO) => nutritionApi.createMealPlan(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: nutritionKeys.all }),
  });
}

export function useAddMealEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ mealPlanId, dto }: { mealPlanId: string; dto: AddMealEntryDTO }) =>
      nutritionApi.addMealEntry(mealPlanId, dto),
    onSuccess: async (_data, { mealPlanId }) => {
      // Sincroniza la lista de compras vinculada (igual que la web)
      try {
        await nutritionApi.syncShoppingList(mealPlanId);
      } catch {
        // sin lista vinculada aún: se ignora
      }
      qc.invalidateQueries({ queryKey: nutritionKeys.all });
    },
  });
}

export function useRemoveMealEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ mealPlanId, entryId }: { mealPlanId: string; entryId: string }) =>
      nutritionApi.removeMealEntry(mealPlanId, entryId),
    onSuccess: async (_data, { mealPlanId }) => {
      try {
        await nutritionApi.syncShoppingList(mealPlanId);
      } catch {
        // sin lista vinculada
      }
      qc.invalidateQueries({ queryKey: nutritionKeys.all });
    },
  });
}

export function useGenerateShoppingList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ mealPlanId, name }: { mealPlanId: string; name: string }) =>
      nutritionApi.generateShoppingList(mealPlanId, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: nutritionKeys.shoppingLists() }),
  });
}

// ─── Shopping Lists ─────────────────────────────────────────────────────────────

export function useShoppingLists() {
  return useQuery({
    queryKey: nutritionKeys.shoppingLists(),
    queryFn: () => nutritionApi.listShoppingLists(),
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateShoppingList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateShoppingListDTO) => nutritionApi.createShoppingList(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: nutritionKeys.shoppingLists() }),
  });
}

export function useDeleteShoppingList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => nutritionApi.deleteShoppingList(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: nutritionKeys.shoppingLists() }),
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
    }) => nutritionApi.checkShoppingItem(listId, itemId, checked),
    onSuccess: () => qc.invalidateQueries({ queryKey: nutritionKeys.shoppingLists() }),
  });
}

export function useLinkTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ listId, transactionId }: { listId: string; transactionId: string }) =>
      nutritionApi.linkTransaction(listId, transactionId),
    onSuccess: () => qc.invalidateQueries({ queryKey: nutritionKeys.shoppingLists() }),
  });
}
