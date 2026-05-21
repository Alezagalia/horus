/**
 * Goal API Service
 * F-02 - Metas y Objetivos (Goals + OKRs)
 */

import { axiosInstance } from '@/lib/axios';
import type {
  GoalWithProgress,
  GoalsResponse,
  GoalResponse,
  KeyResult,
  KeyResultResponse,
  CreateGoalDTO,
  UpdateGoalDTO,
  CreateKeyResultDTO,
  UpdateKeyResultDTO,
} from '@horus/shared';

export async function getGoals(status?: string): Promise<GoalsResponse> {
  const response = await axiosInstance.get<GoalsResponse>('/goals', {
    params: status ? { status } : undefined,
  });
  return response.data;
}

export async function getGoal(id: string): Promise<GoalWithProgress> {
  const response = await axiosInstance.get<GoalResponse>(`/goals/${id}`);
  return response.data.goal;
}

export async function createGoal(data: CreateGoalDTO): Promise<GoalWithProgress> {
  const response = await axiosInstance.post<GoalResponse>('/goals', data);
  return response.data.goal;
}

export async function updateGoal(id: string, data: UpdateGoalDTO): Promise<GoalWithProgress> {
  const response = await axiosInstance.put<GoalResponse>(`/goals/${id}`, data);
  return response.data.goal;
}

export async function deleteGoal(id: string): Promise<void> {
  await axiosInstance.delete(`/goals/${id}`);
}

export async function createKeyResult(
  goalId: string,
  data: CreateKeyResultDTO
): Promise<KeyResult> {
  const response = await axiosInstance.post<KeyResultResponse>(
    `/goals/${goalId}/key-results`,
    data
  );
  return response.data.keyResult;
}

export async function updateKeyResult(
  goalId: string,
  krId: string,
  data: UpdateKeyResultDTO
): Promise<KeyResult> {
  const response = await axiosInstance.put<KeyResultResponse>(
    `/goals/${goalId}/key-results/${krId}`,
    data
  );
  return response.data.keyResult;
}

export async function deleteKeyResult(goalId: string, krId: string): Promise<void> {
  await axiosInstance.delete(`/goals/${goalId}/key-results/${krId}`);
}

export async function linkHabit(goalId: string, habitId: string): Promise<void> {
  await axiosInstance.post(`/goals/${goalId}/habits/${habitId}`);
}

export async function unlinkHabit(goalId: string, habitId: string): Promise<void> {
  await axiosInstance.delete(`/goals/${goalId}/habits/${habitId}`);
}

export async function linkTask(goalId: string, taskId: string): Promise<void> {
  await axiosInstance.post(`/goals/${goalId}/tasks/${taskId}`);
}

export async function unlinkTask(goalId: string, taskId: string): Promise<void> {
  await axiosInstance.delete(`/goals/${goalId}/tasks/${taskId}`);
}
