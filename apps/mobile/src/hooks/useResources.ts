import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  resourceApi,
  type CreateResourceDTO,
  type UpdateResourceDTO,
  type ResourceType,
} from '@/services/api/resourceApi';

export const resourceKeys = {
  all: ['resources'] as const,
  list: (filters?: object) => [...resourceKeys.all, 'list', filters] as const,
};

export function useResources(filters?: {
  type?: ResourceType;
  search?: string;
  isPinned?: boolean;
}) {
  return useQuery({
    queryKey: resourceKeys.list(filters),
    queryFn: () => resourceApi.list(filters),
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateResource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateResourceDTO) => resourceApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: resourceKeys.all });
    },
  });
}

export function useUpdateResource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateResourceDTO }) =>
      resourceApi.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: resourceKeys.all });
    },
  });
}

export function useDeleteResource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => resourceApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: resourceKeys.all });
    },
  });
}

export function useTogglePinResource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => resourceApi.togglePin(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: resourceKeys.all });
    },
  });
}
