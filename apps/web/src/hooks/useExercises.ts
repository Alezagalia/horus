/**
 * React Query Hooks for Exercises
 * Sprint 14 - US-137
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  getExercises,
  getExerciseById,
  createExercise,
  updateExercise,
  deleteExercise,
} from '@/services/api/exerciseApi';
import type { CreateExerciseDTO, UpdateExerciseDTO, ExerciseFilters } from '@horus/shared';

// ==================== Query Keys ====================

export const exerciseKeys = {
  all: ['exercises'] as const,
  lists: () => [...exerciseKeys.all, 'list'] as const,
  list: (filters?: ExerciseFilters) => [...exerciseKeys.lists(), filters] as const,
  details: () => [...exerciseKeys.all, 'detail'] as const,
  detail: (id: string) => [...exerciseKeys.details(), id] as const,
};

// ==================== Queries ====================

/**
 * Hook para obtener todos los ejercicios con filtros opcionales
 */
export function useExercises(filters?: ExerciseFilters) {
  return useQuery({
    queryKey: exerciseKeys.list(filters),
    queryFn: () => getExercises(filters),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Hook para obtener un ejercicio por ID
 */
export function useExercise(id: string | undefined) {
  return useQuery({
    queryKey: exerciseKeys.detail(id!),
    queryFn: () => getExerciseById(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

// ==================== Mutations ====================

/**
 * Hook para crear un nuevo ejercicio
 */
export function useCreateExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateExerciseDTO) => createExercise(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: exerciseKeys.lists() });
      toast.success('Ejercicio creado');
    },
    onError: (error: Error) => {
      toast.error(`Error al crear ejercicio: ${error.message}`);
    },
  });
}

/**
 * Hook para actualizar un ejercicio
 */
export function useUpdateExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateExerciseDTO }) => updateExercise(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: exerciseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: exerciseKeys.detail(variables.id) });
      toast.success('Ejercicio actualizado');
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar ejercicio: ${error.message}`);
    },
  });
}

/**
 * Hook para eliminar un ejercicio
 */
export function useDeleteExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteExercise(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: exerciseKeys.lists() });
      toast.success('Ejercicio eliminado');
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar ejercicio: ${error.message}`);
    },
  });
}
