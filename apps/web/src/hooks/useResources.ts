import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { resourceApi } from '../services/api/resourceApi';
import type {
  CreateResourceDto,
  UpdateResourceDto,
  ResourceFilters,
} from '@horus/shared';
import { toast } from 'react-hot-toast';

export function useResources(filters?: ResourceFilters) {
  return useQuery({
    queryKey: ['resources', filters],
    queryFn: () => resourceApi.getAll(filters),
  });
}

export function useResource(id: string) {
  return useQuery({
    queryKey: ['resources', id],
    queryFn: () => resourceApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateResourceDto) => resourceApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      toast.success('Resource creado exitosamente');
    },
    onError: () => {
      toast.error('Error al crear resource');
    },
  });
}

export function useUpdateResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateResourceDto }) =>
      resourceApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['resources', variables.id] });
      toast.success('Resource actualizado');
    },
    onError: () => {
      toast.error('Error al actualizar resource');
    },
  });
}

export function useDeleteResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => resourceApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      toast.success('Resource eliminado');
    },
    onError: () => {
      toast.error('Error al eliminar resource');
    },
  });
}

export function useTogglePin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => resourceApi.togglePin(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    },
  });
}

export function useResourceSearch(query: string) {
  return useQuery({
    queryKey: ['resources', 'search', query],
    queryFn: () => resourceApi.search(query),
    enabled: query.length > 2,
  });
}

export function useResourceTags() {
  return useQuery({
    queryKey: ['resources', 'tags'],
    queryFn: () => resourceApi.getTags(),
  });
}

export function useResourceStats() {
  return useQuery({
    queryKey: ['resources', 'stats'],
    queryFn: () => resourceApi.getStats(),
  });
}
