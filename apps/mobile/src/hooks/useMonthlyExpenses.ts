import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { monthlyExpenseApi } from '@/services/api/monthlyExpenseApi';
import type { PayMonthlyExpenseDTO } from '@horus/shared';
import { accountKeys } from './useAccounts';

export const monthlyExpenseKeys = {
  all: ['monthlyExpenses'] as const,
  lists: () => [...monthlyExpenseKeys.all, 'list'] as const,
  list: (month: number, year: number) => [...monthlyExpenseKeys.lists(), month, year] as const,
};

export function useMonthlyExpenses(month: number, year: number) {
  return useQuery({
    queryKey: monthlyExpenseKeys.list(month, year),
    queryFn: () => monthlyExpenseApi.list(month, year),
    staleTime: 2 * 60 * 1000,
  });
}

export function usePayMonthlyExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: PayMonthlyExpenseDTO }) =>
      monthlyExpenseApi.pay(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: monthlyExpenseKeys.all });
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
    },
    onError: () => Alert.alert('Error', 'No se pudo registrar el pago'),
  });
}

export function useUndoMonthlyExpensePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => monthlyExpenseApi.undo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: monthlyExpenseKeys.all });
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
    },
    onError: () => Alert.alert('Error', 'No se pudo deshacer el pago'),
  });
}
