import { axiosInstance } from '../axios';
import type {
  AnalyticsOverview,
  HabitHeatmap,
  FinanceTrends,
  Productivity,
  PeriodComparison,
} from '@horus/shared';

export type { AnalyticsOverview, HabitHeatmap, FinanceTrends, Productivity, PeriodComparison };

export const analyticsApi = {
  overview: async (from: string, to: string): Promise<AnalyticsOverview> => {
    const { data } = await axiosInstance.get('/analytics/overview', { params: { from, to } });
    return data;
  },

  productivity: async (from: string, to: string): Promise<Productivity> => {
    const { data } = await axiosInstance.get('/analytics/productivity', { params: { from, to } });
    return data;
  },

  compare: async (
    currentFrom: string,
    currentTo: string,
    previousFrom: string,
    previousTo: string
  ): Promise<PeriodComparison> => {
    const { data } = await axiosInstance.get('/analytics/compare', {
      params: {
        currentFrom,
        currentTo,
        previousFrom,
        previousTo,
        dimensions:
          'habits.completions,tasks.completed,finance.expense,finance.income,workouts.completed',
      },
    });
    return data;
  },
};
