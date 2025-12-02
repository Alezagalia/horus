/**
 * Recurring Expenses React Query Hooks
 * Sprint 13 - US-122
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  getRecurringExpenses,
  getRecurringExpenseById,
  createRecurringExpense,
  updateRecurringExpense,
  deleteRecurringExpense,
} from '@/services/api/recurringExpenseApi';
import type {
  GetRecurringExpensesQuery,
  CreateRecurringExpenseDTO,
  UpdateRecurringExpenseDTO,
} from '@horus/shared';

export const recurringExpenseKeys = {
  all: ['recurringExpenses'] as const,
  lists: () => [...recurringExpenseKeys.all, 'list'] as const,
  list: (query?: GetRecurringExpensesQuery) => [...recurringExpenseKeys.lists(), query] as const,
  details: () => [...recurringExpenseKeys.all, 'detail'] as const,
  detail: (id: string) => [...recurringExpenseKeys.details(), id] as const,
};

/**
 * Get all recurring expense templates
 */
export function useRecurringExpenses(query?: GetRecurringExpensesQuery) {
  return useQuery({
    queryKey: recurringExpenseKeys.list(query),
    queryFn: () => getRecurringExpenses(query),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Get recurring expense by ID
 */
export function useRecurringExpense(id: string) {
  return useQuery({
    queryKey: recurringExpenseKeys.detail(id),
    queryFn: () => getRecurringExpenseById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Create recurring expense
 */
export function useCreateRecurringExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRecurringExpenseDTO) => createRecurringExpense(data),
    onSuccess: () => {
      toast.success('Plantilla de gasto recurrente creada exitosamente');
      queryClient.invalidateQueries({ queryKey: recurringExpenseKeys.all });
    },
    onError: (error: Error) => {
      toast.error(`Error al crear plantilla: ${error.message}`);
    },
  });
}

/**
 * Update recurring expense
 */
export function useUpdateRecurringExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRecurringExpenseDTO }) =>
      updateRecurringExpense(id, data),
    onSuccess: () => {
      toast.success('Plantilla actualizada exitosamente');
      queryClient.invalidateQueries({ queryKey: recurringExpenseKeys.all });
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar plantilla: ${error.message}`);
    },
  });
}

/**
 * Delete recurring expense (soft delete)
 */
export function useDeleteRecurringExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteRecurringExpense(id),
    onSuccess: () => {
      toast.success('Plantilla eliminada exitosamente');
      queryClient.invalidateQueries({ queryKey: recurringExpenseKeys.all });
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar plantilla: ${error.message}`);
    },
  });
}
