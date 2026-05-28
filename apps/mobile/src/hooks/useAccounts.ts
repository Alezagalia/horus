import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountApi } from '@/services/api/accountApi';
import type { CreateAccountDTO, UpdateAccountDTO } from '@/services/api/accountApi';

export const accountKeys = {
  all: ['accounts'] as const,
  list: () => [...accountKeys.all, 'list'] as const,
  financeStats: (month?: number, year?: number) =>
    [...accountKeys.all, 'financeStats', month, year] as const,
};

export function useAccounts() {
  return useQuery({
    queryKey: accountKeys.list(),
    queryFn: accountApi.list,
    staleTime: 1000 * 60 * 5,
  });
}

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
    mutationFn: (dto: CreateAccountDTO) => accountApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
    },
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateAccountDTO }) => accountApi.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
    },
  });
}

export function useDeactivateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => accountApi.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
    },
  });
}
