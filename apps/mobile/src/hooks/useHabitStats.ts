/**
 * useHabitStats Hook
 * Sprint 5 - US-045: Cacheo de Estadísticas con React Query
 *
 * Custom hook for fetching and caching individual habit statistics
 * with optimized cache strategy and refetch behavior.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { getHabitStats, type HabitStats } from '../api/habits.api';

interface UseHabitStatsOptions {
  habitId: string;
  enabled?: boolean;
  refetchOnFocus?: boolean;
}

export const useHabitStats = (options: UseHabitStatsOptions) => {
  const { habitId, enabled = true, refetchOnFocus = true } = options;
  const queryClient = useQueryClient();

  const query = useQuery<HabitStats>({
    queryKey: ['habitStats', habitId],
    queryFn: () => getHabitStats(habitId),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
    enabled: enabled && !!habitId,
  });

  // Refetch on screen focus
  useFocusEffect(
    useCallback(() => {
      if (refetchOnFocus && !query.isFetching && habitId) {
        query.refetch();
      }
    }, [refetchOnFocus, query.isFetching, habitId])
  );

  // Utility to invalidate habit stats cache
  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['habitStats', habitId] });
  }, [queryClient, habitId]);

  // Utility to invalidate all habit stats
  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['habitStats'] });
  }, [queryClient]);

  return {
    ...query,
    invalidate,
    invalidateAll,
  };
};
