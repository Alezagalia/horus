/**
 * Budget API - Mobile
 * F-01 - Presupuestos Mensuales por Categoría
 */

import { apiClient } from '../lib/axios';

export interface BudgetCategory {
  id: string;
  name: string;
  icon?: string | null;
  color?: string | null;
}

export interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  amount: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category?: BudgetCategory;
}

export interface BudgetSummary extends Budget {
  spent: number;
  remaining: number;
  percentage: number;
}

export interface CreateBudgetInput {
  categoryId: string;
  amount: number;
  currency: string;
}

export interface UpdateBudgetInput {
  amount?: number;
  currency?: string;
}

export const getBudgets = async (): Promise<Budget[]> => {
  const response = await apiClient.get<{ budgets: Budget[] }>('/budgets');
  return response.data.budgets;
};

export const getBudgetsSummary = async (month: number, year: number): Promise<BudgetSummary[]> => {
  const response = await apiClient.get<{ summary: BudgetSummary[] }>('/budgets/summary', {
    params: { month, year },
  });
  return response.data.summary;
};

export const createBudget = async (data: CreateBudgetInput): Promise<Budget> => {
  const response = await apiClient.post<{ budget: Budget }>('/budgets', data);
  return response.data.budget;
};

export const updateBudget = async (id: string, data: UpdateBudgetInput): Promise<Budget> => {
  const response = await apiClient.put<{ budget: Budget }>(`/budgets/${id}`, data);
  return response.data.budget;
};

export const deleteBudget = async (id: string): Promise<void> => {
  await apiClient.delete(`/budgets/${id}`);
};
