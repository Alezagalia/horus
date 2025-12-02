/**
 * Accounts React Query Hooks
 * Sprint 13 - US-119
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  getAccounts,
  getAccountById,
  createAccount,
  updateAccount,
  deactivateAccount,
  getFinanceStats,
} from '@/services/api/accountApi';
import type { UpdateAccountDTO } from '@horus/shared';

export const accountKeys = {
  all: ['accounts'] as const,
  lists: () => [...accountKeys.all, 'list'] as const,
  list: () => [...accountKeys.lists()] as const,
  details: () => [...accountKeys.all, 'detail'] as const,
  detail: (id: string) => [...accountKeys.details(), id] as const,
  stats: (month?: number, year?: number) => [...accountKeys.all, 'stats', { month, year }] as const,
};

/**
 * Get all accounts
 */
export function useAccounts() {
  return useQuery({
    queryKey: accountKeys.list(),
    queryFn: getAccounts,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Get account by ID
 */
export function useAccount(id: string) {
  return useQuery({
    queryKey: accountKeys.detail(id),
    queryFn: () => getAccountById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Create account
 */
export function useCreateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAccount,
    onSuccess: () => {
      toast.success('Cuenta creada exitosamente');
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
    },
    onError: (error: Error) => {
      toast.error(`Error al crear cuenta: ${error.message}`);
    },
  });
}

/**
 * Update account
 */
export function useUpdateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAccountDTO }) => updateAccount(id, data),
    onSuccess: () => {
      toast.success('Cuenta actualizada exitosamente');
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar cuenta: ${error.message}`);
    },
  });
}

/**
 * Deactivate account
 */
export function useDeactivateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deactivateAccount,
    onSuccess: () => {
      toast.success('Cuenta desactivada exitosamente');
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
    },
    onError: (error: Error) => {
      toast.error(`Error al desactivar cuenta: ${error.message}`);
    },
  });
}

/**
 * Get finance statistics
 */
export function useFinanceStats(month?: number, year?: number) {
  return useQuery({
    queryKey: accountKeys.stats(month, year),
    queryFn: () => getFinanceStats(month, year),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}
