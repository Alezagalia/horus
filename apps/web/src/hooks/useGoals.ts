/**
 * Goal React Query Hooks
 * F-02 - Metas y Objetivos (Goals + OKRs)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  getGoals,
  getGoal,
  createGoal,
  updateGoal,
  deleteGoal,
  featureGoal,
  getFeaturedGoal,
  createKeyResult,
  updateKeyResult,
  deleteKeyResult,
  linkHabit,
  unlinkHabit,
  linkTask,
  unlinkTask,
} from '@/services/api/goalApi';
import type {
  CreateGoalDTO,
  UpdateGoalDTO,
  CreateKeyResultDTO,
  UpdateKeyResultDTO,
} from '@horus/shared';

export const goalKeys = {
  all: ['goals'] as const,
  list: (status?: string) => ['goals', status] as const,
  detail: (id: string) => ['goals', id] as const,
  featured: ['goals', 'featured'] as const,
};

export function useGoals(status?: string) {
  return useQuery({
    queryKey: goalKeys.list(status),
    queryFn: () => getGoals(status),
    staleTime: 1000 * 60 * 5,
  });
}

export function useGoal(id: string) {
  return useQuery({
    queryKey: goalKeys.detail(id),
    queryFn: () => getGoal(id),
    staleTime: 1000 * 60 * 5,
    enabled: !!id,
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateGoalDTO) => createGoal(data),
    onSuccess: () => {
      toast.success('Meta creada exitosamente');
      queryClient.invalidateQueries({ queryKey: goalKeys.all });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al crear meta');
    },
  });
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateGoalDTO }) => updateGoal(id, data),
    onSuccess: (goal) => {
      toast.success('Meta actualizada exitosamente');
      queryClient.invalidateQueries({ queryKey: goalKeys.all });
      queryClient.invalidateQueries({ queryKey: goalKeys.detail(goal.id) });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al actualizar meta');
    },
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteGoal(id),
    onSuccess: () => {
      toast.success('Meta eliminada exitosamente');
      queryClient.invalidateQueries({ queryKey: goalKeys.all });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al eliminar meta');
    },
  });
}

export function useFeaturedGoal() {
  return useQuery({
    queryKey: goalKeys.featured,
    queryFn: () => getFeaturedGoal(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useFeatureGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => featureGoal(id),
    onSuccess: (goal) => {
      toast.success(
        goal.isFeatured ? '⭐ Meta destacada en el dashboard' : 'Meta removida del dashboard',
        { duration: 2000 }
      );
      queryClient.invalidateQueries({ queryKey: goalKeys.all });
      queryClient.invalidateQueries({ queryKey: goalKeys.featured });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al destacar meta');
    },
  });
}

export function useCreateKeyResult(goalId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateKeyResultDTO) => createKeyResult(goalId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalKeys.detail(goalId) });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al crear Key Result');
    },
  });
}

export function useUpdateKeyResult(goalId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ krId, data }: { krId: string; data: UpdateKeyResultDTO }) =>
      updateKeyResult(goalId, krId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalKeys.detail(goalId) });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al actualizar Key Result');
    },
  });
}

export function useDeleteKeyResult(goalId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (krId: string) => deleteKeyResult(goalId, krId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalKeys.detail(goalId) });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al eliminar Key Result');
    },
  });
}

export function useLinkHabit(goalId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ habitId, krId }: { habitId: string; krId?: string }) =>
      linkHabit(goalId, habitId, krId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalKeys.detail(goalId) });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al vincular hábito');
    },
  });
}

export function useUnlinkHabit(goalId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (habitId: string) => unlinkHabit(goalId, habitId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalKeys.detail(goalId) });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al desvincular hábito');
    },
  });
}

export function useLinkTask(goalId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => linkTask(goalId, taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalKeys.detail(goalId) });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al vincular tarea');
    },
  });
}

export function useUnlinkTask(goalId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => unlinkTask(goalId, taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalKeys.detail(goalId) });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al desvincular tarea');
    },
  });
}
