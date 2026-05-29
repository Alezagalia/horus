import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { goalApi } from '@/services/api/goalApi';
import type {
  CreateGoalDTO,
  UpdateGoalDTO,
  CreateKeyResultDTO,
  UpdateKeyResultDTO,
} from '@horus/shared';

export const goalKeys = {
  all: ['goals'] as const,
  list: (status?: string) => [...goalKeys.all, 'list', status] as const,
  detail: (id: string) => [...goalKeys.all, 'detail', id] as const,
  featured: ['goals', 'featured'] as const,
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

export function useGoal(id: string | undefined) {
  return useQuery({
    queryKey: goalKeys.detail(id!),
    queryFn: () => goalApi.getById(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
  });
}

export function useFeaturedGoal() {
  return useQuery({
    queryKey: goalKeys.featured,
    queryFn: () => goalApi.getFeaturedGoal(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useFeatureGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => goalApi.featureGoal(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: goalKeys.all });
      qc.invalidateQueries({ queryKey: goalKeys.featured });
    },
  });
}

export function useCreateKeyResult() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ goalId, dto }: { goalId: string; dto: CreateKeyResultDTO }) =>
      goalApi.createKeyResult(goalId, dto),
    onSuccess: (_, { goalId }) => {
      qc.invalidateQueries({ queryKey: goalKeys.detail(goalId) });
      qc.invalidateQueries({ queryKey: goalKeys.all });
    },
  });
}

export function useUpdateKeyResult() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      goalId,
      krId,
      dto,
    }: {
      goalId: string;
      krId: string;
      dto: UpdateKeyResultDTO;
    }) => goalApi.updateKeyResult(goalId, krId, dto),
    onSuccess: (_, { goalId }) => {
      qc.invalidateQueries({ queryKey: goalKeys.detail(goalId) });
      qc.invalidateQueries({ queryKey: goalKeys.all });
    },
  });
}

export function useDeleteKeyResult() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ goalId, krId }: { goalId: string; krId: string }) =>
      goalApi.deleteKeyResult(goalId, krId),
    onSuccess: (_, { goalId }) => {
      qc.invalidateQueries({ queryKey: goalKeys.detail(goalId) });
      qc.invalidateQueries({ queryKey: goalKeys.all });
    },
  });
}
