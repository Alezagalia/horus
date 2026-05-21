/**
 * Budget API Service
 * F-01 - Presupuestos Mensuales por Categoría
 */

import { axiosInstance } from '@/lib/axios';
import type {
  Budget,
  CreateBudgetDTO,
  UpdateBudgetDTO,
  BudgetsResponse,
  BudgetsSummaryResponse,
} from '@horus/shared';

export async function getBudgets(): Promise<BudgetsResponse> {
  const response = await axiosInstance.get<BudgetsResponse>('/budgets');
  return response.data;
}

export async function getBudgetsSummary(
  month: number,
  year: number
): Promise<BudgetsSummaryResponse> {
  const response = await axiosInstance.get<BudgetsSummaryResponse>('/budgets/summary', {
    params: { month, year },
  });
  return response.data;
}

export async function createBudget(data: CreateBudgetDTO): Promise<Budget> {
  const response = await axiosInstance.post<{ message: string; budget: Budget }>('/budgets', data);
  return response.data.budget;
}

export async function updateBudget(id: string, data: UpdateBudgetDTO): Promise<Budget> {
  const response = await axiosInstance.put<{ message: string; budget: Budget }>(
    `/budgets/${id}`,
    data
  );
  return response.data.budget;
}

export async function deleteBudget(id: string): Promise<void> {
  await axiosInstance.delete(`/budgets/${id}`);
}
