import { axiosInstance } from '../axios';
import type { InsightsResponse } from '@horus/shared';

export type { InsightsResponse };

export const insightApi = {
  get: async (): Promise<InsightsResponse> => {
    const { data } = await axiosInstance.get('/insights');
    return data;
  },

  dismiss: async (id: string): Promise<void> => {
    await axiosInstance.post(`/insights/${id}/dismiss`);
  },

  seen: async (id: string): Promise<void> => {
    await axiosInstance.post(`/insights/${id}/seen`);
  },
};
