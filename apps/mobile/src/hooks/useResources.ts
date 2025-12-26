/**
 * Resources Hooks
 * Fase 3 - Mobile Implementation
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { Alert } from 'react-native';
import { resourcesApi } from '../api/resources.api';
import type {
  CreateResourceDto,
  UpdateResourceDto,
  ResourceFilters,
} from '@horus/shared';

/**
 * Fetch all resources with optional filters
 */
export function useResources(filters?: ResourceFilters, refetchOnFocus = true) {
  const query = useQuery({
    queryKey: ['resources', filters],
    queryFn: () => resourcesApi.getAll(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });

  // Refetch on screen focus
  useFocusEffect(
    useCallback(() => {
      if (refetchOnFocus && !query.isFetching) {
        query.refetch();
      }
    }, [refetchOnFocus, query.isFetching])
  );

  return query;
}

/**
 * Fetch a single resource by ID
 */
export function useResource(id: string) {
  return useQuery({
    queryKey: ['resources', id],
    queryFn: () => resourcesApi.getById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}

/**
 * Create a new resource
 */
export function useCreateResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateResourceDto) => resourcesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      Alert.alert('Éxito', 'Resource creado exitosamente');
    },
    onError: (error: any) => {
      Alert.alert('Error', error?.response?.data?.error || 'Error al crear resource');
    },
  });
}

/**
 * Update an existing resource
 */
export function useUpdateResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateResourceDto }) =>
      resourcesApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['resources', variables.id] });
      Alert.alert('Éxito', 'Resource actualizado');
    },
    onError: (error: any) => {
      Alert.alert('Error', error?.response?.data?.error || 'Error al actualizar resource');
    },
  });
}

/**
 * Delete a resource
 */
export function useDeleteResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => resourcesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      Alert.alert('Éxito', 'Resource eliminado');
    },
    onError: (error: any) => {
      Alert.alert('Error', error?.response?.data?.error || 'Error al eliminar resource');
    },
  });
}

/**
 * Toggle pin status
 */
export function useTogglePin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => resourcesApi.togglePin(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    },
    onError: (error: any) => {
      Alert.alert('Error', error?.response?.data?.error || 'Error al marcar/desmarcar');
    },
  });
}

/**
 * Search resources
 */
export function useResourceSearch(query: string) {
  return useQuery({
    queryKey: ['resources', 'search', query],
    queryFn: () => resourcesApi.search(query),
    enabled: query.length > 2,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Get all tags
 */
export function useResourceTags() {
  return useQuery({
    queryKey: ['resources', 'tags'],
    queryFn: () => resourcesApi.getTags(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Get resource statistics
 */
export function useResourceStats() {
  return useQuery({
    queryKey: ['resources', 'stats'],
    queryFn: () => resourcesApi.getStats(),
    staleTime: 1000 * 60 * 5,
  });
}
