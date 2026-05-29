import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { budgetApi } from '@/services/api/budgetApi';
import type { CreateBudgetDTO, UpdateBudgetDTO } from '@horus/shared';

export const budgetKeys = {
  all: ['budgets'] as const,
  lists: () => [...budgetKeys.all, 'list'] as const,
  summary: (month: number, year: number) => [...budgetKeys.all, 'summary', month, year] as const,
};

export function useBudgets() {
  return useQuery({
    queryKey: budgetKeys.lists(),
    queryFn: () => budgetApi.list(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useBudgetsSummary(month: number, year: number) {
  return useQuery({
    queryKey: budgetKeys.summary(month, year),
    queryFn: () => budgetApi.summary(month, year),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateBudgetDTO) => budgetApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.all });
    },
    onError: () => Alert.alert('Error', 'No se pudo crear el presupuesto'),
  });
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateBudgetDTO }) => budgetApi.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.all });
    },
    onError: () => Alert.alert('Error', 'No se pudo actualizar el presupuesto'),
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => budgetApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.all });
    },
    onError: () => Alert.alert('Error', 'No se pudo eliminar el presupuesto'),
  });
}
