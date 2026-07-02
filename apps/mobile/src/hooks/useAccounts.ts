import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountApi } from '@/services/api/accountApi';
import type { CreateAccountDTO, UpdateAccountDTO } from '@/services/api/accountApi';
import { useWatermelonQuery } from './useWatermelonQuery';
import { listAccountsLocal } from '@/db/moneyQueries';
import { createAccountLocal, updateAccountLocal, deactivateAccountLocal } from '@/db/moneyWrites';

export const accountKeys = {
  all: ['accounts'] as const,
  list: () => [...accountKeys.all, 'list'] as const,
  financeStats: (month?: number, year?: number) =>
    [...accountKeys.all, 'financeStats', month, year] as const,
};

/** Offline-first: lee de WatermelonDB (SQLite local); el sync la mantiene al día. */
export function useAccounts() {
  return useWatermelonQuery(accountKeys.list(), listAccountsLocal, ['accounts']);
}

/** Analytics: sigue siendo online (REST) con cache persistida. */
export function useFinanceStats(month?: number, year?: number) {
  return useQuery({
    queryKey: accountKeys.financeStats(month, year),
    queryFn: () => accountApi.getFinanceStats(month, year),
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateAccountDTO) => createAccountLocal(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
    },
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateAccountDTO }) => updateAccountLocal(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
    },
  });
}

export function useDeactivateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deactivateAccountLocal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
    },
  });
}
