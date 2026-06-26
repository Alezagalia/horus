import { useQuery } from '@tanstack/react-query';
import { subscriptionApi } from '@/services/api/subscriptionApi';

export const subscriptionKeys = {
  mine: ['subscription', 'mine'] as const,
};

/** Current user's plan, limits and feature flags. */
export function useSubscription() {
  return useQuery({
    queryKey: subscriptionKeys.mine,
    queryFn: subscriptionApi.getMine,
    staleTime: 5 * 60 * 1000,
  });
}
