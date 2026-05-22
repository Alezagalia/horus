/**
 * Life Debt API Service
 * F-14 - Deuda de Vida
 * Sprint 17
 */

import { axiosInstance } from '@/lib/axios';
import type {
  LifeDebtDecisionRequest,
  LifeDebtDecisionResponse,
  LifeDebtResponse,
} from '@horus/shared';

export async function getLifeDebt(): Promise<LifeDebtResponse> {
  const response = await axiosInstance.get<LifeDebtResponse>('/life-debt');
  return response.data;
}

export async function recordDecision(
  data: LifeDebtDecisionRequest
): Promise<LifeDebtDecisionResponse> {
  const response = await axiosInstance.post<LifeDebtDecisionResponse>('/life-debt/decisions', data);
  return response.data;
}

export async function reviewRecurringExpense(
  id: string
): Promise<{ id: string; lastReviewedAt: string }> {
  const response = await axiosInstance.post<{ id: string; lastReviewedAt: string }>(
    `/life-debt/recurring-expenses/${id}/review`
  );
  return response.data;
}
