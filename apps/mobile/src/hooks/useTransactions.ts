import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  transactionApi,
  type CreateTransactionDTO,
  type TransactionType,
} from '@/services/api/transactionApi';

export const transactionKeys = {
  all: ['transactions'] as const,
  list: (filters?: object) => [...transactionKeys.all, 'list', filters] as const,
  categories: (scope?: string) => ['txCategories', scope] as const,
};

export function useTransactions(filters?: {
  accountId?: string;
  type?: TransactionType;
  from?: string;
  to?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: transactionKeys.list(filters),
    queryFn: () => transactionApi.list(filters),
    staleTime: 1000 * 60,
  });
}

export function useTxCategories(scope?: string) {
  return useQuery({
    queryKey: transactionKeys.categories(scope),
    queryFn: () => transactionApi.listCategories(scope),
    staleTime: 1000 * 60 * 10,
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateTransactionDTO) => transactionApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => transactionApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}
