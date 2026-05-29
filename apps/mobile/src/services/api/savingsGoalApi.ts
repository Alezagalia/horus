import { axiosInstance } from '../axios';
import type {
  SavingsGoalWithProgress,
  SavingsGoalsResponse,
  SavingsGoalResponse,
  CreateSavingsGoalDTO,
  UpdateSavingsGoalDTO,
} from '@horus/shared';

export type { SavingsGoalWithProgress };

export const savingsGoalApi = {
  list: async (): Promise<SavingsGoalsResponse> => {
    const { data } = await axiosInstance.get('/savings-goals');
    return data;
  },

  create: async (dto: CreateSavingsGoalDTO): Promise<SavingsGoalWithProgress> => {
    const { data } = await axiosInstance.post<SavingsGoalResponse>('/savings-goals', dto);
    return data.savingsGoal;
  },

  update: async (id: string, dto: UpdateSavingsGoalDTO): Promise<SavingsGoalWithProgress> => {
    const { data } = await axiosInstance.put<SavingsGoalResponse>(`/savings-goals/${id}`, dto);
    return data.savingsGoal;
  },

  remove: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/savings-goals/${id}`);
  },
};
