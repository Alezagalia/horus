import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { categoryApi } from '@/services/api/categoryApi';
import type { Scope, CreateCategoryDTO, UpdateCategoryDTO } from '@horus/shared';

export const categoryKeys = {
  all: ['categories'] as const,
  list: (scope?: Scope) => [...categoryKeys.all, 'list', scope ?? 'all'] as const,
};

export function useCategories(scope?: Scope) {
  return useQuery({
    queryKey: categoryKeys.list(scope),
    queryFn: () => categoryApi.list(scope),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateCategoryDTO) => categoryApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'No se pudo crear la categoría';
      Alert.alert('Error', msg);
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateCategoryDTO }) =>
      categoryApi.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
    onError: () => Alert.alert('Error', 'No se pudo actualizar la categoría'),
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => categoryApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'No se pudo eliminar la categoría';
      Alert.alert('Error', msg);
    },
  });
}

export function useSetDefaultCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => categoryApi.setDefault(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
    onError: () => Alert.alert('Error', 'No se pudo establecer como predeterminada'),
  });
}
