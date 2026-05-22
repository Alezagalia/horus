/**
 * Life Debt React Query Hooks
 * F-14 - Deuda de Vida
 * Sprint 17
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import type { LifeDebtDecisionRequest } from '@horus/shared';
import * as lifeDebtApi from '@/services/api/lifeDebtApi';

export const lifeDebtKeys = {
  all: ['life-debt'] as const,
};

const STALE_1_MIN = 1000 * 60;

export function useLifeDebt() {
  return useQuery({
    queryKey: lifeDebtKeys.all,
    queryFn: () => lifeDebtApi.getLifeDebt(),
    staleTime: STALE_1_MIN,
  });
}

export function useRecordDecision() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: LifeDebtDecisionRequest) => lifeDebtApi.recordDecision(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lifeDebtKeys.all });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al registrar decisión');
    },
  });
}

export function useReviewRecurringExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => lifeDebtApi.reviewRecurringExpense(id),
    onSuccess: () => {
      toast.success('Marcado como revisado');
      queryClient.invalidateQueries({ queryKey: lifeDebtKeys.all });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al marcar como revisado');
    },
  });
}
