/**
 * React Query Hooks for Categories
 * Sprint 11 - US-102
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  setDefaultCategory,
  type GetCategoriesFilters,
} from '@/services/api/categoryApi';
import type { CreateCategoryDTO, UpdateCategoryDTO } from '@horus/shared';

// ==================== Query Keys ====================

export const categoryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
  list: (filters?: GetCategoriesFilters) => [...categoryKeys.lists(), filters] as const,
  details: () => [...categoryKeys.all, 'detail'] as const,
  detail: (id: string) => [...categoryKeys.details(), id] as const,
};

// ==================== Queries ====================

/**
 * Hook para obtener todas las categorías con filtros opcionales
 */
export function useCategories(filters?: GetCategoriesFilters) {
  return useQuery({
    queryKey: categoryKeys.list(filters),
    queryFn: () => getCategories(filters),
    staleTime: 1000 * 60 * 5, // 5 minutos (categorías cambian poco)
  });
}

/**
 * Hook para obtener una categoría por ID
 */
export function useCategory(id: string | undefined) {
  return useQuery({
    queryKey: categoryKeys.detail(id!),
    queryFn: () => getCategoryById(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

// ==================== Mutations ====================

/**
 * Hook para crear una nueva categoría
 */
export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCategoryDTO) => createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      toast.success('Categoría creada');
    },
    onError: (error: Error) => {
      toast.error(`Error al crear categoría: ${error.message}`);
    },
  });
}

/**
 * Hook para actualizar una categoría
 */
export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryDTO }) => updateCategory(id, data),
    onSuccess: (updatedCategory) => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: categoryKeys.detail(updatedCategory.id) });
      toast.success('Categoría actualizada');
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar categoría: ${error.message}`);
    },
  });
}

/**
 * Hook para eliminar una categoría
 */
export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      queryClient.removeQueries({ queryKey: categoryKeys.detail(deletedId) });
      toast.success('Categoría eliminada');
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar categoría: ${error.message}`);
    },
  });
}

/**
 * Hook para marcar una categoría como default
 */
export function useSetDefaultCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => setDefaultCategory(id),
    onSuccess: () => {
      // Invalidar todas las listas porque cambia el default de otra categoría
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      toast.success('Categoría marcada como predeterminada');
    },
    onError: (error: Error) => {
      toast.error(`Error: ${error.message}`);
    },
  });
}
