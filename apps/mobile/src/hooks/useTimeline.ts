import { useInfiniteQuery } from '@tanstack/react-query';
import { timelineApi } from '@/services/api/timelineApi';
import type { TimelineModule, TimelineEventCategory } from '@/services/api/timelineApi';

const PAGE_SIZE = 50;

export const timelineKeys = {
  all: ['timeline'] as const,
  list: (modules?: TimelineModule[], categories?: TimelineEventCategory[]) =>
    [
      ...timelineKeys.all,
      'list',
      modules?.join(',') ?? 'all',
      categories?.join(',') ?? 'all',
    ] as const,
};

export function useTimeline(modules?: TimelineModule[], categories?: TimelineEventCategory[]) {
  return useInfiniteQuery({
    queryKey: timelineKeys.list(modules, categories),
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      timelineApi.get({
        modules: modules?.length ? modules : undefined,
        categories: categories?.length ? categories : undefined,
        limit: PAGE_SIZE,
        offset: pageParam as number,
      }),
    getNextPageParam: (lastPage, _all, lastPageParam) => {
      if (!lastPage.hasMore) return undefined;
      return (lastPageParam as number) + PAGE_SIZE;
    },
    staleTime: 5 * 60 * 1000,
  });
}
