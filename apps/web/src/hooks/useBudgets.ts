/**
 * Budget React Query Hooks
 * F-01 - Presupuestos Mensuales por Categoría
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  getBudgets,
  getBudgetsSummary,
  createBudget,
  updateBudget,
  deleteBudget,
} from '@/services/api/budgetApi';
import type { CreateBudgetDTO, UpdateBudgetDTO } from '@horus/shared';

export const budgetKeys = {
  all: ['budgets'] as const,
  summary: (month: number, year: number) => ['budgets', 'summary', month, year] as const,
};

export function useBudgets() {
  return useQuery({
    queryKey: budgetKeys.all,
    queryFn: getBudgets,
    staleTime: 1000 * 60 * 5,
  });
}

export function useBudgetsSummary(month: number, year: number) {
  return useQuery({
    queryKey: budgetKeys.summary(month, year),
    queryFn: () => getBudgetsSummary(month, year),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBudgetDTO) => createBudget(data),
    onSuccess: () => {
      toast.success('Presupuesto creado exitosamente');
      queryClient.invalidateQueries({ queryKey: budgetKeys.all });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al crear presupuesto');
    },
  });
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBudgetDTO }) => updateBudget(id, data),
    onSuccess: () => {
      toast.success('Presupuesto actualizado exitosamente');
      queryClient.invalidateQueries({ queryKey: budgetKeys.all });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al actualizar presupuesto');
    },
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBudget(id),
    onSuccess: () => {
      toast.success('Presupuesto eliminado exitosamente');
      queryClient.invalidateQueries({ queryKey: budgetKeys.all });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al eliminar presupuesto');
    },
  });
}
