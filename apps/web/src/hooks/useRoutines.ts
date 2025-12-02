/**
 * React Query Hooks for Routines
 * Sprint 14 - US-137
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  getRoutines,
  getRoutineById,
  createRoutine,
  updateRoutine,
  deleteRoutine,
  duplicateRoutine,
} from '@/services/api/routineApi';
import type { CreateRoutineDTO, UpdateRoutineDTO } from '@horus/shared';

// ==================== Query Keys ====================

export const routineKeys = {
  all: ['routines'] as const,
  lists: () => [...routineKeys.all, 'list'] as const,
  list: () => [...routineKeys.lists()] as const,
  details: () => [...routineKeys.all, 'detail'] as const,
  detail: (id: string) => [...routineKeys.details(), id] as const,
};

// ==================== Queries ====================

/**
 * Hook para obtener todas las rutinas
 */
export function useRoutines() {
  return useQuery({
    queryKey: routineKeys.list(),
    queryFn: () => getRoutines(),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Hook para obtener una rutina por ID
 */
export function useRoutine(id: string | undefined) {
  return useQuery({
    queryKey: routineKeys.detail(id!),
    queryFn: () => getRoutineById(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 2, // 2 minutos (más dinámico que ejercicios)
  });
}

// ==================== Mutations ====================

/**
 * Hook para crear una nueva rutina
 */
export function useCreateRoutine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRoutineDTO) => createRoutine(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: routineKeys.lists() });
      toast.success('Rutina creada');
    },
    onError: (error: Error) => {
      toast.error(`Error al crear rutina: ${error.message}`);
    },
  });
}

/**
 * Hook para actualizar una rutina
 */
export function useUpdateRoutine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRoutineDTO }) => updateRoutine(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: routineKeys.lists() });
      queryClient.invalidateQueries({ queryKey: routineKeys.detail(variables.id) });
      toast.success('Rutina actualizada');
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar rutina: ${error.message}`);
    },
  });
}

/**
 * Hook para eliminar una rutina
 */
export function useDeleteRoutine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteRoutine(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: routineKeys.lists() });
      toast.success('Rutina eliminada');
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar rutina: ${error.message}`);
    },
  });
}

/**
 * Hook para duplicar una rutina
 */
export function useDuplicateRoutine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => duplicateRoutine(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: routineKeys.lists() });
      toast.success('Rutina duplicada');
    },
    onError: (error: Error) => {
      toast.error(`Error al duplicar rutina: ${error.message}`);
    },
  });
}
