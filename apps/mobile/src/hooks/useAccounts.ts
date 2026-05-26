import { useQuery } from '@tanstack/react-query';
import { accountApi } from '@/services/api/accountApi';

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
