import { axiosInstance } from '../axios';
import type {
  LifeDebtResponse,
  LifeDebtDecisionRequest,
  LifeDebtDecisionResponse,
  LifeDebtItemType,
} from '@horus/shared';

export type {
  LifeDebtResponse,
  LifeDebtDecisionRequest,
  LifeDebtDecisionResponse,
  LifeDebtItemType,
};

export const lifeDebtApi = {
  get: async (): Promise<LifeDebtResponse> => {
    const { data } = await axiosInstance.get('/life-debt');
    return data;
  },

  recordDecision: async (dto: LifeDebtDecisionRequest): Promise<LifeDebtDecisionResponse> => {
    const { data } = await axiosInstance.post('/life-debt/decisions', dto);
    return data;
  },

  reviewRecurringExpense: async (id: string): Promise<{ id: string; lastReviewedAt: string }> => {
    const { data } = await axiosInstance.post(`/life-debt/recurring-expenses/${id}/review`);
    return data;
  },
};
