import { axiosInstance } from '../axios';
import type { OverviewStatsResponse, ExerciseStatsResponse } from '@horus/shared';

export type { OverviewStatsResponse, ExerciseStatsResponse };

export const workoutStatsApi = {
  overview: async (days: number = 30): Promise<OverviewStatsResponse> => {
    const { data } = await axiosInstance.get('/stats/overview', { params: { days } });
    return data;
  },

  exerciseStats: async (exerciseId: string, days: number = 90): Promise<ExerciseStatsResponse> => {
    const { data } = await axiosInstance.get(`/stats/exercises/${exerciseId}`, {
      params: { days },
    });
    return data;
  },
};
