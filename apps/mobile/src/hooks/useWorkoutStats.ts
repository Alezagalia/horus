import { useQuery } from '@tanstack/react-query';
import { workoutStatsApi } from '@/services/api/workoutStatsApi';

export const workoutStatsKeys = {
  all: ['workout-stats'] as const,
  overview: (days: number) => [...workoutStatsKeys.all, 'overview', days] as const,
  exercise: (exerciseId: string, days: number) =>
    [...workoutStatsKeys.all, 'exercise', exerciseId, days] as const,
};

export function useOverviewStats(days: number = 30) {
  return useQuery({
    queryKey: workoutStatsKeys.overview(days),
    queryFn: () => workoutStatsApi.overview(days),
    staleTime: 5 * 60 * 1000,
  });
}

export function useExerciseStats(exerciseId: string | undefined, days: number = 90) {
  return useQuery({
    queryKey: workoutStatsKeys.exercise(exerciseId!, days),
    queryFn: () => workoutStatsApi.exerciseStats(exerciseId!, days),
    enabled: !!exerciseId,
    staleTime: 5 * 60 * 1000,
  });
}
