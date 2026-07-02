import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import type { PayMonthlyExpenseDTO } from '@horus/shared';
import { accountKeys } from './useAccounts';
import { useWatermelonQuery } from './useWatermelonQuery';
import { listMonthlyExpensesLocal } from '@/db/moneyQueries';
import { payMonthlyExpenseLocal, undoMonthlyExpensePaymentLocal } from '@/db/moneyWrites';

export const monthlyExpenseKeys = {
  all: ['monthlyExpenses'] as const,
  lists: () => [...monthlyExpenseKeys.all, 'list'] as const,
  list: (month: number, year: number) => [...monthlyExpenseKeys.lists(), month, year] as const,
};

/** Offline-first: lee de WatermelonDB; el sync trae las instancias que genera el server. */
export function useMonthlyExpenses(month: number, year: number) {
  return useWatermelonQuery(
    monthlyExpenseKeys.list(month, year),
    () => listMonthlyExpensesLocal(month, year),
    ['monthly_expense_instances', 'recurring_expenses', 'accounts', 'categories']
  );
}

export function usePayMonthlyExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: PayMonthlyExpenseDTO }) =>
      payMonthlyExpenseLocal(id, dto),
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
    mutationFn: (id: string) => undoMonthlyExpensePaymentLocal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: monthlyExpenseKeys.all });
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
    },
    onError: () => Alert.alert('Error', 'No se pudo deshacer el pago'),
  });
}
