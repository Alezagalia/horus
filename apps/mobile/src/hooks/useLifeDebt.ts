import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { lifeDebtApi } from '@/services/api/lifeDebtApi';
import type { LifeDebtDecisionRequest } from '@/services/api/lifeDebtApi';

export const lifeDebtKeys = {
  all: ['life-debt'] as const,
};

export function useLifeDebt() {
  return useQuery({
    queryKey: lifeDebtKeys.all,
    queryFn: () => lifeDebtApi.get(),
    staleTime: 60 * 1000,
  });
}

export function useRecordDecision() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: LifeDebtDecisionRequest) => lifeDebtApi.recordDecision(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lifeDebtKeys.all });
    },
    onError: () => Alert.alert('Error', 'No se pudo registrar la decisión'),
  });
}

export function useReviewRecurringExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => lifeDebtApi.reviewRecurringExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lifeDebtKeys.all });
    },
    onError: () => Alert.alert('Error', 'No se pudo marcar como revisado'),
  });
}
