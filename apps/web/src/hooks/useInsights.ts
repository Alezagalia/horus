/**
 * Insights React Query Hooks
 * F-12 - Motor de Correlaciones Personales
 * Sprint 18
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import * as insightApi from '@/services/api/insightApi';

export const insightKeys = {
  all: ['insights'] as const,
};

// Insights are expensive to compute (lazy detector run on the backend) — cache longer.
const STALE_15_MIN = 1000 * 60 * 15;

export function useInsights() {
  return useQuery({
    queryKey: insightKeys.all,
    queryFn: () => insightApi.getInsights(),
    staleTime: STALE_15_MIN,
  });
}

export function useDismissInsight() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => insightApi.dismissInsight(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: insightKeys.all });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al descartar insight');
    },
  });
}

export function useMarkSeenInsight() {
  return useMutation({
    mutationFn: (id: string) => insightApi.markSeenInsight(id),
  });
}
