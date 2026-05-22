/**
 * Analytics API Service
 * F-07 - Reportes y Tendencias
 * Sprint 15 - US-147
 */

import { axiosInstance } from '@/lib/axios';
import type {
  AnalyticsOverview,
  ComparableDimension,
  FinanceTrends,
  HabitHeatmap,
  PeriodComparison,
  Productivity,
} from '@horus/shared';

interface RangeParams {
  from?: string;
  to?: string;
}

export async function getOverview(params: RangeParams = {}): Promise<AnalyticsOverview> {
  const response = await axiosInstance.get<AnalyticsOverview>('/analytics/overview', { params });
  return response.data;
}

export async function getHabitsHeatmap(year?: number): Promise<HabitHeatmap> {
  const response = await axiosInstance.get<HabitHeatmap>('/analytics/habits/heatmap', {
    params: year !== undefined ? { year } : {},
  });
  return response.data;
}

export async function getFinanceTrends(months: number = 6): Promise<FinanceTrends> {
  const response = await axiosInstance.get<FinanceTrends>('/analytics/finance/trends', {
    params: { months },
  });
  return response.data;
}

export async function getProductivity(params: RangeParams = {}): Promise<Productivity> {
  const response = await axiosInstance.get<Productivity>('/analytics/productivity', { params });
  return response.data;
}

interface CompareParams {
  currentFrom: string;
  currentTo: string;
  previousFrom: string;
  previousTo: string;
  dimensions?: ComparableDimension[];
}

export async function compare(params: CompareParams): Promise<PeriodComparison> {
  const response = await axiosInstance.get<PeriodComparison>('/analytics/compare', {
    params: {
      ...params,
      dimensions: params.dimensions?.join(','),
    },
  });
  return response.data;
}
