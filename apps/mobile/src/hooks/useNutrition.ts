import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { nutritionApi } from '@/services/api/nutritionApi';
import type {
  FoodFilters,
  CreateFoodDTO,
  UpdateFoodDTO,
  AddNutritionLogItemDTO,
} from '@horus/shared';

export const nutritionKeys = {
  all: ['nutrition'] as const,
  foods: (filters?: FoodFilters) => [...nutritionKeys.all, 'foods', filters] as const,
  log: (date: string) => [...nutritionKeys.all, 'log', date] as const,
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
