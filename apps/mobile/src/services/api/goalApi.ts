import { axiosInstance } from '../axios';
import type { GoalWithProgress, CreateGoalDTO, UpdateGoalDTO } from '@horus/shared';

export const goalApi = {
  list: async (status?: string): Promise<GoalWithProgress[]> => {
    const { data } = await axiosInstance.get('/goals', { params: status ? { status } : undefined });
    return data.goals ?? [];
  },

  create: async (dto: CreateGoalDTO): Promise<GoalWithProgress> => {
    const { data } = await axiosInstance.post('/goals', dto);
    return data.goal ?? data;
  },

  update: async (id: string, dto: UpdateGoalDTO): Promise<GoalWithProgress> => {
    const { data } = await axiosInstance.put(`/goals/${id}`, dto);
    return data.goal ?? data;
  },

  remove: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/goals/${id}`);
  },
};
