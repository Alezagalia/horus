/**
 * Savings Goal API Service
 * Metas de Ahorro vinculadas a Cuentas
 */

import { axiosInstance } from '@/lib/axios';
import type {
  SavingsGoalWithProgress,
  SavingsGoalsResponse,
  SavingsGoalResponse,
  CreateSavingsGoalDTO,
  UpdateSavingsGoalDTO,
} from '@horus/shared';

export async function getSavingsGoals(): Promise<SavingsGoalsResponse> {
  const response = await axiosInstance.get<SavingsGoalsResponse>('/savings-goals');
  return response.data;
}

export async function getSavingsGoal(id: string): Promise<SavingsGoalWithProgress> {
  const response = await axiosInstance.get<SavingsGoalResponse>(`/savings-goals/${id}`);
  return response.data.savingsGoal;
}

export async function createSavingsGoal(
  data: CreateSavingsGoalDTO
): Promise<SavingsGoalWithProgress> {
  const response = await axiosInstance.post<SavingsGoalResponse>('/savings-goals', data);
  return response.data.savingsGoal;
}

export async function updateSavingsGoal(
  id: string,
  data: UpdateSavingsGoalDTO
): Promise<SavingsGoalWithProgress> {
  const response = await axiosInstance.put<SavingsGoalResponse>(`/savings-goals/${id}`, data);
  return response.data.savingsGoal;
}

export async function deleteSavingsGoal(id: string): Promise<void> {
  await axiosInstance.delete(`/savings-goals/${id}`);
}
