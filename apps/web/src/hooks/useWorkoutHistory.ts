/**
 * React Query Hooks for Workout History
 * Sprint 14 - US-139
 */

import { useQuery } from '@tanstack/react-query';
import {
  listWorkouts,
  getWorkoutById,
  type ListWorkoutsFilters,
} from '@/services/api/workoutHistoryApi';

// ==================== Query Keys ====================

export const workoutHistoryKeys = {
  all: ['workouts'] as const,
  lists: () => [...workoutHistoryKeys.all, 'list'] as const,
  list: (filters?: ListWorkoutsFilters) => [...workoutHistoryKeys.lists(), filters] as const,
  details: () => [...workoutHistoryKeys.all, 'detail'] as const,
  detail: (id: string) => [...workoutHistoryKeys.details(), id] as const,
};

// ==================== Queries ====================

/**
 * Hook para listar workouts con filtros
 */
export function useWorkouts(filters?: ListWorkoutsFilters) {
  return useQuery({
    queryKey: workoutHistoryKeys.list(filters),
    queryFn: () => listWorkouts(filters),
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
}

/**
 * Hook para obtener el detalle de un workout
 */
export function useWorkout(id: string | undefined) {
  return useQuery({
    queryKey: workoutHistoryKeys.detail(id!),
    queryFn: () => getWorkoutById(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutos (histórico, no cambia frecuentemente)
  });
}
