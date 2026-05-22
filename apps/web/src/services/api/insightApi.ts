/**
 * Insights API Service
 * F-12 - Motor de Correlaciones Personales
 * Sprint 18
 */

import { axiosInstance } from '@/lib/axios';
import type { InsightsResponse } from '@horus/shared';

export async function getInsights(): Promise<InsightsResponse> {
  const response = await axiosInstance.get<InsightsResponse>('/insights');
  return response.data;
}

export async function dismissInsight(id: string): Promise<void> {
  await axiosInstance.post(`/insights/${id}/dismiss`);
}

export async function markSeenInsight(id: string): Promise<void> {
  await axiosInstance.post(`/insights/${id}/seen`);
}
