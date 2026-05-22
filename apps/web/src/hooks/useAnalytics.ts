/**
 * Analytics React Query Hooks
 * F-07 - Reportes y Tendencias
 * Sprint 15 - US-147
 */

import { useQuery } from '@tanstack/react-query';
import type { ComparableDimension } from '@horus/shared';
import * as analyticsApi from '@/services/api/analyticsApi';

export const analyticsKeys = {
  all: ['analytics'] as const,
  overview: (from?: string, to?: string) => ['analytics', 'overview', from, to] as const,
  heatmap: (year: number) => ['analytics', 'heatmap', year] as const,
  financeTrends: (months: number) => ['analytics', 'finance-trends', months] as const,
  productivity: (from?: string, to?: string) => ['analytics', 'productivity', from, to] as const,
  compare: (
    currentFrom: string,
    currentTo: string,
    previousFrom: string,
    previousTo: string,
    dimensions?: ComparableDimension[]
  ) =>
    [
      'analytics',
      'compare',
      currentFrom,
      currentTo,
      previousFrom,
      previousTo,
      dimensions?.join(',') ?? 'all',
    ] as const,
};

const STALE_2_MIN = 1000 * 60 * 2;
const STALE_10_MIN = 1000 * 60 * 10;

export function useOverview(from?: string, to?: string) {
  return useQuery({
    queryKey: analyticsKeys.overview(from, to),
    queryFn: () => analyticsApi.getOverview({ from, to }),
    staleTime: STALE_2_MIN,
  });
}

export function useHabitsHeatmap(year: number) {
  return useQuery({
    queryKey: analyticsKeys.heatmap(year),
    queryFn: () => analyticsApi.getHabitsHeatmap(year),
    staleTime: STALE_10_MIN,
  });
}

export function useFinanceTrends(months: number) {
  return useQuery({
    queryKey: analyticsKeys.financeTrends(months),
    queryFn: () => analyticsApi.getFinanceTrends(months),
    staleTime: STALE_10_MIN,
  });
}

export function useProductivity(from?: string, to?: string) {
  return useQuery({
    queryKey: analyticsKeys.productivity(from, to),
    queryFn: () => analyticsApi.getProductivity({ from, to }),
    staleTime: STALE_10_MIN,
  });
}

interface UseCompareArgs {
  currentFrom: string;
  currentTo: string;
  previousFrom: string;
  previousTo: string;
  dimensions?: ComparableDimension[];
  enabled?: boolean;
}

export function useCompare({
  currentFrom,
  currentTo,
  previousFrom,
  previousTo,
  dimensions,
  enabled = true,
}: UseCompareArgs) {
  return useQuery({
    queryKey: analyticsKeys.compare(currentFrom, currentTo, previousFrom, previousTo, dimensions),
    queryFn: () =>
      analyticsApi.compare({ currentFrom, currentTo, previousFrom, previousTo, dimensions }),
    enabled,
    staleTime: STALE_2_MIN,
  });
}
