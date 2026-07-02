import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import type { CreateBudgetDTO, UpdateBudgetDTO } from '@horus/shared';
import { useWatermelonQuery } from './useWatermelonQuery';
import { listBudgetsLocal, budgetsSummaryLocal } from '@/db/moneyQueries';
import { createBudgetLocal, updateBudgetLocal, deleteBudgetLocal } from '@/db/moneyWrites';

export const budgetKeys = {
  all: ['budgets'] as const,
  lists: () => [...budgetKeys.all, 'list'] as const,
  summary: (month: number, year: number) => [...budgetKeys.all, 'summary', month, year] as const,
};

/** Offline-first: lee de WatermelonDB. */
export function useBudgets() {
  return useWatermelonQuery(budgetKeys.lists(), listBudgetsLocal, ['budgets', 'categories']);
}

/** El gastado se computa localmente desde transactions (espejo del summary REST). */
export function useBudgetsSummary(month: number, year: number) {
  return useWatermelonQuery(
    budgetKeys.summary(month, year),
    () => budgetsSummaryLocal(month, year),
    ['budgets', 'categories', 'transactions', 'accounts']
  );
}

export function useCreateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateBudgetDTO) => createBudgetLocal(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.all });
    },
    onError: () => Alert.alert('Error', 'No se pudo crear el presupuesto'),
  });
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateBudgetDTO }) => updateBudgetLocal(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.all });
    },
    onError: () => Alert.alert('Error', 'No se pudo actualizar el presupuesto'),
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBudgetLocal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.all });
    },
    onError: () => Alert.alert('Error', 'No se pudo eliminar el presupuesto'),
  });
}
