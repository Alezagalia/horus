/**
 * Monthly Expenses React Query Hooks
 * Sprint 13 - US-123
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  getMonthlyExpenses,
  getCurrentMonthlyExpenses,
  payMonthlyExpense,
  updateMonthlyExpense,
  undoMonthlyExpensePayment,
} from '@/services/api/monthlyExpenseApi';
import type {
  GetMonthlyExpensesQuery,
  PayMonthlyExpenseDTO,
  UpdateMonthlyExpenseDTO,
} from '@horus/shared';

export const monthlyExpenseKeys = {
  all: ['monthlyExpenses'] as const,
  lists: () => [...monthlyExpenseKeys.all, 'list'] as const,
  list: (month: number, year: number, query?: GetMonthlyExpensesQuery) =>
    [...monthlyExpenseKeys.lists(), month, year, query] as const,
  current: (query?: GetMonthlyExpensesQuery) =>
    [...monthlyExpenseKeys.lists(), 'current', query] as const,
};

/**
 * Get monthly expenses for specific month/year
 */
export function useMonthlyExpenses(month: number, year: number, query?: GetMonthlyExpensesQuery) {
  return useQuery({
    queryKey: monthlyExpenseKeys.list(month, year, query),
    queryFn: () => getMonthlyExpenses(month, year, query),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Get current month's expenses
 */
export function useCurrentMonthlyExpenses(query?: GetMonthlyExpensesQuery) {
  return useQuery({
    queryKey: monthlyExpenseKeys.current(query),
    queryFn: () => getCurrentMonthlyExpenses(query),
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Pay monthly expense
 */
export function usePayMonthlyExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PayMonthlyExpenseDTO }) =>
      payMonthlyExpense(id, data),
    onSuccess: () => {
      toast.success('Gasto marcado como pagado exitosamente');
      queryClient.invalidateQueries({ queryKey: monthlyExpenseKeys.all });
      // Invalidate accounts to update balances
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
    onError: (error: Error) => {
      toast.error(`Error al marcar gasto: ${error.message}`);
    },
  });
}

/**
 * Update paid monthly expense
 */
export function useUpdateMonthlyExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMonthlyExpenseDTO }) =>
      updateMonthlyExpense(id, data),
    onSuccess: () => {
      toast.success('Gasto actualizado exitosamente');
      queryClient.invalidateQueries({ queryKey: monthlyExpenseKeys.all });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar gasto: ${error.message}`);
    },
  });
}

/**
 * Undo monthly expense payment
 */
export function useUndoMonthlyExpensePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => undoMonthlyExpensePayment(id),
    onSuccess: () => {
      toast.success('Pago deshecho exitosamente');
      queryClient.invalidateQueries({ queryKey: monthlyExpenseKeys.all });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
    onError: (error: Error) => {
      toast.error(`Error al deshacer pago: ${error.message}`);
    },
  });
}
