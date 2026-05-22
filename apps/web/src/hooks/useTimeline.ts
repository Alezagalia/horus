/**
 * Timeline React Query Hook
 * F-16 - Arqueología Personal
 * Sprint 16 - US-153
 */

import { useInfiniteQuery } from '@tanstack/react-query';
import type { TimelineEventCategory, TimelineModule } from '@horus/shared';
import { getTimeline } from '@/services/api/timelineApi';

interface UseTimelineArgs {
  modules?: TimelineModule[];
  categories?: TimelineEventCategory[];
  from?: string;
  to?: string;
  pageSize?: number;
}

const STALE_5_MIN = 1000 * 60 * 5;

export function useTimeline({
  modules,
  categories,
  from,
  to,
  pageSize = 100,
}: UseTimelineArgs = {}) {
  return useInfiniteQuery({
    queryKey: [
      'timeline',
      modules?.join(',') ?? 'all',
      categories?.join(',') ?? 'all',
      from ?? '',
      to ?? '',
      pageSize,
    ],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      getTimeline({
        modules,
        categories,
        from,
        to,
        limit: pageSize,
        offset: pageParam as number,
      }),
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      if (!lastPage.hasMore) return undefined;
      return (lastPageParam as number) + pageSize;
    },
    staleTime: STALE_5_MIN,
  });
}
