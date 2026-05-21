/**
 * Goals API - Mobile
 * F-02 - Metas y Objetivos (Goals + OKRs)
 */

import { apiClient } from '../lib/axios';

export type GoalStatus = 'en_progreso' | 'completada' | 'cancelada';
export type GoalPriority = 'alta' | 'media' | 'baja';

export interface GoalCategory {
  id: string;
  name: string;
  icon?: string | null;
  color?: string | null;
}

export interface KeyResult {
  id: string;
  goalId: string;
  title: string;
  targetValue: number;
  currentValue: number;
  unit?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GoalHabit {
  habitId: string;
  habit: { id: string; name: string; icon?: string | null; lastCompletedDate?: string | null };
}

export interface GoalTask {
  taskId: string;
  task: { id: string; title: string; status: string };
}

export interface Goal {
  id: string;
  userId: string;
  categoryId?: string | null;
  title: string;
  description?: string | null;
  priority: GoalPriority;
  status: GoalStatus;
  targetDate?: string | null;
  completedAt?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category?: GoalCategory | null;
  keyResults?: KeyResult[];
  goalHabits?: GoalHabit[];
  goalTasks?: GoalTask[];
  progress: number;
  linkedHabitsCount: number;
  linkedTasksCount: number;
}

export interface CreateGoalInput {
  title: string;
  description?: string;
  categoryId?: string;
  priority?: GoalPriority;
  targetDate?: string;
}

export interface UpdateGoalInput extends Partial<CreateGoalInput> {
  status?: GoalStatus;
}

export interface CreateKeyResultInput {
  title: string;
  targetValue: number;
  currentValue?: number;
  unit?: string;
}

export type UpdateKeyResultInput = Partial<CreateKeyResultInput>;

export const getGoals = async (status?: GoalStatus): Promise<Goal[]> => {
  const response = await apiClient.get<{ goals: Goal[] }>('/goals', {
    params: status ? { status } : undefined,
  });
  return response.data.goals;
};

export const getGoal = async (id: string): Promise<Goal> => {
  const response = await apiClient.get<{ goal: Goal }>(`/goals/${id}`);
  return response.data.goal;
};

export const createGoal = async (data: CreateGoalInput): Promise<Goal> => {
  const response = await apiClient.post<{ goal: Goal }>('/goals', data);
  return response.data.goal;
};

export const updateGoal = async (id: string, data: UpdateGoalInput): Promise<Goal> => {
  const response = await apiClient.put<{ goal: Goal }>(`/goals/${id}`, data);
  return response.data.goal;
};

export const deleteGoal = async (id: string): Promise<void> => {
  await apiClient.delete(`/goals/${id}`);
};

export const createKeyResult = async (
  goalId: string,
  data: CreateKeyResultInput
): Promise<KeyResult> => {
  const response = await apiClient.post<{ keyResult: KeyResult }>(
    `/goals/${goalId}/key-results`,
    data
  );
  return response.data.keyResult;
};

export const updateKeyResult = async (
  goalId: string,
  krId: string,
  data: UpdateKeyResultInput
): Promise<KeyResult> => {
  const response = await apiClient.put<{ keyResult: KeyResult }>(
    `/goals/${goalId}/key-results/${krId}`,
    data
  );
  return response.data.keyResult;
};

export const deleteKeyResult = async (goalId: string, krId: string): Promise<void> => {
  await apiClient.delete(`/goals/${goalId}/key-results/${krId}`);
};

export const linkHabit = async (goalId: string, habitId: string): Promise<void> => {
  await apiClient.post(`/goals/${goalId}/habits/${habitId}`);
};

export const unlinkHabit = async (goalId: string, habitId: string): Promise<void> => {
  await apiClient.delete(`/goals/${goalId}/habits/${habitId}`);
};

export const linkTask = async (goalId: string, taskId: string): Promise<void> => {
  await apiClient.post(`/goals/${goalId}/tasks/${taskId}`);
};

export const unlinkTask = async (goalId: string, taskId: string): Promise<void> => {
  await apiClient.delete(`/goals/${goalId}/tasks/${taskId}`);
};
