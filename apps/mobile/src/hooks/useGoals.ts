import { useQuery } from '@tanstack/react-query';
import { goalApi } from '@/services/api/goalApi';

export const goalKeys = {
  all: ['goals'] as const,
  list: (status?: string) => [...goalKeys.all, 'list', status] as const,
};

export function useGoals(status?: string) {
  return useQuery({
    queryKey: goalKeys.list(status),
    queryFn: () => goalApi.list(status),
    staleTime: 1000 * 60 * 5,
  });
}
