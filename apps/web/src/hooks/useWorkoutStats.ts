/**
 * React Query Hooks for Workout Stats
 * Sprint 14 - US-139
 */

import { useQuery } from '@tanstack/react-query';
import { getOverviewStats, getExerciseStats } from '@/services/api/workoutStatsApi';

// ==================== Query Keys ====================

export const workoutStatsKeys = {
  all: ['workout-stats'] as const,
  overview: (days: number) => [...workoutStatsKeys.all, 'overview', days] as const,
  exercise: (exerciseId: string, days: number) =>
    [...workoutStatsKeys.all, 'exercise', exerciseId, days] as const,
};

// ==================== Queries ====================

/**
 * Hook para obtener estadísticas generales
 */
export function useOverviewStats(days: number = 30) {
  return useQuery({
    queryKey: workoutStatsKeys.overview(days),
    queryFn: () => getOverviewStats(days),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Hook para obtener estadísticas de un ejercicio específico
 */
export function useExerciseStats(exerciseId: string | undefined, days: number = 90) {
  return useQuery({
    queryKey: workoutStatsKeys.exercise(exerciseId!, days),
    queryFn: () => getExerciseStats(exerciseId!, days),
    enabled: !!exerciseId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}
