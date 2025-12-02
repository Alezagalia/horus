/**
 * Transactions React Query Hooks
 * Sprint 13 - US-120
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  createTransfer,
  updateTransfer,
} from '@/services/api/transactionApi';
import type { GetTransactionsQuery, UpdateTransactionDTO, UpdateTransferDTO } from '@horus/shared';

export const transactionKeys = {
  all: ['transactions'] as const,
  lists: () => [...transactionKeys.all, 'list'] as const,
  list: (query?: GetTransactionsQuery) => [...transactionKeys.lists(), query] as const,
  details: () => [...transactionKeys.all, 'detail'] as const,
  detail: (id: string) => [...transactionKeys.details(), id] as const,
};

/**
 * Get transactions with optional filters
 */
export function useTransactions(query?: GetTransactionsQuery) {
  return useQuery({
    queryKey: transactionKeys.list(query),
    queryFn: () => getTransactions(query),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Get transaction by ID
 */
export function useTransaction(id: string) {
  return useQuery({
    queryKey: transactionKeys.detail(id),
    queryFn: () => getTransactionById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Create transaction
 */
export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      toast.success('Transacción creada exitosamente');
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      // Also invalidate accounts to update balances
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
    onError: (error: Error) => {
      toast.error(`Error al crear transacción: ${error.message}`);
    },
  });
}

/**
 * Update transaction
 */
export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTransactionDTO }) =>
      updateTransaction(id, data),
    onSuccess: () => {
      toast.success('Transacción actualizada exitosamente');
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar transacción: ${error.message}`);
    },
  });
}

/**
 * Delete transaction
 */
export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTransaction,
    onSuccess: () => {
      toast.success('Transacción eliminada exitosamente');
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar transacción: ${error.message}`);
    },
  });
}

/**
 * Create transfer between accounts
 */
export function useCreateTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTransfer,
    onSuccess: () => {
      toast.success('Transferencia creada exitosamente');
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
    onError: (error: Error) => {
      toast.error(`Error al crear transferencia: ${error.message}`);
    },
  });
}

/**
 * Update transfer
 */
export function useUpdateTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTransferDTO }) => updateTransfer(id, data),
    onSuccess: () => {
      toast.success('Transferencia actualizada exitosamente');
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar transferencia: ${error.message}`);
    },
  });
}
