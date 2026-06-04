import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateActivityDTO, UpdateActivityDTO, ToggleActivityRecordDTO } from '@horus/shared';
import { activityApi } from '@/services/api/activityApi';

export const activityKeys = {
  all: ['activities'] as const,
  list: (date?: string) => [...activityKeys.all, 'list', date ?? 'all'] as const,
  allList: () => [...activityKeys.all, 'allList'] as const,
};

export function useActivities(date?: string) {
  return useQuery({
    queryKey: activityKeys.list(date),
    queryFn: () => activityApi.list(date),
    staleTime: 1000 * 60 * 3,
  });
}

export function useAllActivities() {
  return useQuery({
    queryKey: activityKeys.allList(),
    queryFn: activityApi.listAll,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateActivityDTO) => activityApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
    },
  });
}

export function useUpdateActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateActivityDTO }) =>
      activityApi.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
    },
  });
}

export function useDeleteActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => activityApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
    },
  });
}

export function useToggleActivityRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: ToggleActivityRecordDTO }) =>
      activityApi.toggleRecord(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
    },
  });
}
