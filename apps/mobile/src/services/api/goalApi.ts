import { axiosInstance } from '../axios';
import type { GoalWithProgress } from '@horus/shared';

export const goalApi = {
  list: async (status?: string): Promise<GoalWithProgress[]> => {
    const { data } = await axiosInstance.get('/goals', { params: status ? { status } : undefined });
    return data.goals ?? [];
  },
};
