import { axiosInstance } from '../axios';
import type {
  GoalWithProgress,
  CreateGoalDTO,
  UpdateGoalDTO,
  KeyResult,
  CreateKeyResultDTO,
  UpdateKeyResultDTO,
} from '@horus/shared';

export const goalApi = {
  list: async (status?: string): Promise<GoalWithProgress[]> => {
    const { data } = await axiosInstance.get('/goals', { params: status ? { status } : undefined });
    return data.goals ?? [];
  },

  getById: async (id: string): Promise<GoalWithProgress> => {
    const { data } = await axiosInstance.get(`/goals/${id}`);
    return data.goal ?? data;
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

  // ─── Key Results ─────────────────────────────────────────────────────────────

  createKeyResult: async (goalId: string, dto: CreateKeyResultDTO): Promise<KeyResult> => {
    const { data } = await axiosInstance.post(`/goals/${goalId}/key-results`, dto);
    return data.keyResult ?? data;
  },

  updateKeyResult: async (
    goalId: string,
    krId: string,
    dto: UpdateKeyResultDTO
  ): Promise<KeyResult> => {
    const { data } = await axiosInstance.put(`/goals/${goalId}/key-results/${krId}`, dto);
    return data.keyResult ?? data;
  },

  deleteKeyResult: async (goalId: string, krId: string): Promise<void> => {
    await axiosInstance.delete(`/goals/${goalId}/key-results/${krId}`);
  },

  featureGoal: async (id: string): Promise<GoalWithProgress> => {
    const { data } = await axiosInstance.put(`/goals/${id}/feature`);
    return data.data ?? data;
  },

  getFeaturedGoal: async (): Promise<GoalWithProgress | null> => {
    const { data } = await axiosInstance.get('/goals/featured');
    return data.data ?? null;
  },
};
