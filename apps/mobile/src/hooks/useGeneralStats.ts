/**
 * useGeneralStats Hook
 * Sprint 5 - US-045: Cacheo de Estadísticas con React Query
 *
 * Custom hook for fetching and caching general user statistics
 * with optimized cache strategy and refetch behavior.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { getGeneralStats, type GeneralStats } from '../api/habits.api';

interface UseGeneralStatsOptions {
  enabled?: boolean;
  refetchOnFocus?: boolean;
}

export const useGeneralStats = (options: UseGeneralStatsOptions = {}) => {
  const { enabled = true, refetchOnFocus = true } = options;
  const queryClient = useQueryClient();

  const query = useQuery<GeneralStats>({
    queryKey: ['generalStats'],
    queryFn: getGeneralStats,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
    enabled,
  });

  // Refetch on screen focus
  useFocusEffect(
    useCallback(() => {
      if (refetchOnFocus && !query.isFetching) {
        query.refetch();
      }
    }, [refetchOnFocus, query.isFetching])
  );

  // Utility to invalidate general stats cache
  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['generalStats'] });
  }, [queryClient]);

  return {
    ...query,
    invalidate,
  };
};
