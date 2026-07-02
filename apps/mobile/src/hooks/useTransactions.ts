import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  CreateTransactionDTO,
  UpdateTransactionDTO,
  CreateTransferDTO,
  TransactionType,
} from '@/services/api/transactionApi';
import { useWatermelonQuery } from './useWatermelonQuery';
import { listTransactionsLocal, listCategoriesLocal } from '@/db/moneyQueries';
import {
  createTransactionLocal,
  updateTransactionLocal,
  deleteTransactionLocal,
  createTransferLocal,
} from '@/db/moneyWrites';

export const transactionKeys = {
  all: ['transactions'] as const,
  list: (filters?: object) => [...transactionKeys.all, 'list', filters] as const,
  categories: (scope?: string) => ['txCategories', scope] as const,
};

/** Offline-first: lee de WatermelonDB; reacciona a escrituras locales y al sync. */
export function useTransactions(filters?: {
  accountId?: string;
  type?: TransactionType;
  from?: string;
  to?: string;
  limit?: number;
}) {
  return useWatermelonQuery(transactionKeys.list(filters), () => listTransactionsLocal(filters), [
    'transactions',
    'accounts',
    'categories',
  ]);
}

export function useTxCategories(scope?: string) {
  return useWatermelonQuery(transactionKeys.categories(scope), () => listCategoriesLocal(scope), [
    'categories',
  ]);
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateTransactionDTO) => createTransactionLocal(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateTransactionDTO }) =>
      updateTransactionLocal(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}

export function useCreateTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateTransferDTO) => createTransferLocal(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTransactionLocal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}
