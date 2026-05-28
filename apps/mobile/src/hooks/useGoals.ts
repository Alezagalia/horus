import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { goalApi } from '@/services/api/goalApi';
import type { CreateGoalDTO, UpdateGoalDTO } from '@horus/shared';

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

export function useCreateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateGoalDTO) => goalApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalKeys.all });
    },
  });
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateGoalDTO }) => goalApi.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalKeys.all });
    },
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => goalApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalKeys.all });
    },
  });
}
