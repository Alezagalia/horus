import { useQuery } from '@tanstack/react-query';
import { format, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { analyticsApi } from '@/services/api/analyticsApi';

function isoDate(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}

export const analyticsKeys = {
  all: ['analytics'] as const,
  overview: (from: string, to: string) => [...analyticsKeys.all, 'overview', from, to] as const,
  productivity: (from: string, to: string) =>
    [...analyticsKeys.all, 'productivity', from, to] as const,
  compare: (cf: string, ct: string, pf: string, pt: string) =>
    [...analyticsKeys.all, 'compare', cf, ct, pf, pt] as const,
};

export function useDateRange(days: number): { from: string; to: string } {
  const to = new Date();
  const from = subDays(to, days - 1);
  return { from: isoDate(from), to: isoDate(to) };
}

export function useOverviewAnalytics(days: number) {
  const { from, to } = useDateRange(days);
  return useQuery({
    queryKey: analyticsKeys.overview(from, to),
    queryFn: () => analyticsApi.overview(from, to),
    staleTime: 2 * 60 * 1000,
  });
}

export function useProductivityAnalytics(days: number) {
  const { from, to } = useDateRange(days);
  return useQuery({
    queryKey: analyticsKeys.productivity(from, to),
    queryFn: () => analyticsApi.productivity(from, to),
    staleTime: 10 * 60 * 1000,
  });
}

// Compare current month vs previous month, or current week vs previous week
export function useCompareAnalytics(mode: 'week' | 'month') {
  const today = new Date();
  let currentFrom: string, currentTo: string, previousFrom: string, previousTo: string;

  if (mode === 'month') {
    currentFrom = isoDate(startOfMonth(today));
    currentTo = isoDate(endOfMonth(today));
    const prevMonth = subMonths(today, 1);
    previousFrom = isoDate(startOfMonth(prevMonth));
    previousTo = isoDate(endOfMonth(prevMonth));
  } else {
    // week: last 7 days vs 7 days before that
    currentTo = isoDate(today);
    currentFrom = isoDate(subDays(today, 6));
    previousTo = isoDate(subDays(today, 7));
    previousFrom = isoDate(subDays(today, 13));
  }

  return useQuery({
    queryKey: analyticsKeys.compare(currentFrom, currentTo, previousFrom, previousTo),
    queryFn: () => analyticsApi.compare(currentFrom, currentTo, previousFrom, previousTo),
    staleTime: 2 * 60 * 1000,
  });
}
