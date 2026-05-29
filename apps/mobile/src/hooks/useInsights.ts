import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { insightApi } from '@/services/api/insightApi';

export const insightKeys = {
  all: ['insights'] as const,
};

export function useInsights() {
  return useQuery({
    queryKey: insightKeys.all,
    queryFn: () => insightApi.get(),
    staleTime: 15 * 60 * 1000,
  });
}

export function useDismissInsight() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => insightApi.dismiss(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: insightKeys.all });
    },
    onError: () => Alert.alert('Error', 'No se pudo descartar el insight'),
  });
}

export function useMarkInsightSeen() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => insightApi.seen(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: insightKeys.all });
    },
  });
}
