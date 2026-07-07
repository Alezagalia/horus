import { useMutation } from '@tanstack/react-query';
import type {
  CreateGoalDTO,
  UpdateGoalDTO,
  CreateKeyResultDTO,
  UpdateKeyResultDTO,
} from '@horus/shared';
import { listGoalsLocal, getGoalByIdLocal, getFeaturedGoalLocal } from '@/db/goalQueries';
import {
  createGoalLocal,
  updateGoalLocal,
  deleteGoalLocal,
  featureGoalLocal,
  createKeyResultLocal,
  updateKeyResultLocal,
  deleteKeyResultLocal,
} from '@/db/goalWrites';
import { useWatermelonQuery } from './useWatermelonQuery';

/**
 * Hooks de Metas — offline-first Fase 2c: lecturas y escrituras sobre
 * WatermelonDB (goals, key_results, goal_habits, goal_tasks), replicadas vía
 * /api/replication. El progreso se calcula localmente con la misma fórmula
 * del server. Los vínculos meta↔hábito/tarea son de solo lectura en mobile.
 */

export const goalKeys = {
  all: ['goals'] as const,
  list: (status?: string) => [...goalKeys.all, 'list', status] as const,
  detail: (id: string) => [...goalKeys.all, 'detail', id] as const,
  featured: ['goals', 'featured'] as const,
};

// El progreso depende de KRs, vínculos y el estado de hábitos/tareas locales
const GOAL_TABLES = ['goals', 'key_results', 'goal_habits', 'goal_tasks', 'tasks', 'habits'];

export function useGoals(status?: string) {
  return useWatermelonQuery(goalKeys.list(status), () => listGoalsLocal(status), GOAL_TABLES);
}

export function useGoal(id: string | undefined) {
  return useWatermelonQuery(
    goalKeys.detail(id ?? 'none'),
    () => (id ? getGoalByIdLocal(id) : Promise.resolve(undefined)),
    GOAL_TABLES
  );
}

export function useFeaturedGoal() {
  return useWatermelonQuery(goalKeys.featured, getFeaturedGoalLocal, GOAL_TABLES);
}

// Las mutaciones no invalidan a mano: el observable de Watermelon
// (withChangesForTables) invalida y relee de SQLite tras cada escritura.

export function useCreateGoal() {
  return useMutation({
    mutationFn: (dto: CreateGoalDTO) => createGoalLocal(dto),
  });
}

export function useUpdateGoal() {
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateGoalDTO }) => updateGoalLocal(id, dto),
  });
}

export function useDeleteGoal() {
  return useMutation({
    mutationFn: (id: string) => deleteGoalLocal(id),
  });
}

export function useFeatureGoal() {
  return useMutation({
    mutationFn: (id: string) => featureGoalLocal(id),
  });
}

export function useCreateKeyResult() {
  return useMutation({
    mutationFn: ({ goalId, dto }: { goalId: string; dto: CreateKeyResultDTO }) =>
      createKeyResultLocal(goalId, dto),
  });
}

export function useUpdateKeyResult() {
  return useMutation({
    mutationFn: ({ krId, dto }: { goalId: string; krId: string; dto: UpdateKeyResultDTO }) =>
      updateKeyResultLocal(krId, dto),
  });
}

export function useDeleteKeyResult() {
  return useMutation({
    mutationFn: ({ krId }: { goalId: string; krId: string }) => deleteKeyResultLocal(krId),
  });
}
