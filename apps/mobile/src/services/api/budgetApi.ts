import { axiosInstance } from '../axios';
import { postIdempotent } from '../idempotent';
import type {
  Budget,
  BudgetSummary,
  BudgetsResponse,
  BudgetsSummaryResponse,
  CreateBudgetDTO,
  UpdateBudgetDTO,
} from '@horus/shared';

export type { Budget, BudgetSummary };

export const budgetApi = {
  list: async (): Promise<BudgetsResponse> => {
    const { data } = await axiosInstance.get('/budgets');
    return data;
  },

  summary: async (month: number, year: number): Promise<BudgetsSummaryResponse> => {
    const { data } = await axiosInstance.get('/budgets/summary', {
      params: { month, year },
    });
    return data;
  },

  create: async (dto: CreateBudgetDTO): Promise<Budget> => {
    const data = await postIdempotent<any>('/budgets', dto);
    return data.budget ?? data;
  },

  update: async (id: string, dto: UpdateBudgetDTO): Promise<Budget> => {
    const { data } = await axiosInstance.put(`/budgets/${id}`, dto);
    return data.budget ?? data;
  },

  remove: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/budgets/${id}`);
  },
};
