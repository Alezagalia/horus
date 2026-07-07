import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateTaskDTO, UpdateTaskDTO } from '@/services/api/taskApi';
import { listTasksLocal } from '@/db/taskQueries';
import { listCategoriesLocal } from '@/db/moneyQueries';
import {
  createTaskLocal,
  updateTaskLocal,
  toggleTaskLocal,
  deleteTaskLocal,
  addChecklistItemLocal,
  updateChecklistItemLocal,
  deleteChecklistItemLocal,
} from '@/db/taskWrites';
import { useWatermelonQuery } from './useWatermelonQuery';

/**
 * Hooks de Tareas — offline-first Fase 2b: lecturas y escrituras sobre
 * WatermelonDB (tasks, task_checklist_items, categories scope `tareas`),
 * replicadas vía /api/replication. Misma interfaz que la versión REST.
 */

export const taskKeys = {
  all: ['tasks'] as const,
  list: (filters?: object) => [...taskKeys.all, 'list', filters] as const,
};

const TASK_TABLES = ['tasks', 'task_checklist_items', 'categories'];

export function useTasks(filters?: { status?: string }) {
  return useWatermelonQuery(taskKeys.list(filters), () => listTasksLocal(filters), TASK_TABLES);
}

export function useTaskCategories() {
  return useWatermelonQuery(['categories', 'tareas'], () => listCategoriesLocal('tareas'), [
    'categories',
  ]);
}

// Las mutaciones no invalidan a mano: el observable de Watermelon
// (withChangesForTables) invalida y relee de SQLite tras cada escritura.

export function useToggleTaskComplete() {
  return useMutation({
    mutationFn: (taskId: string) => toggleTaskLocal(taskId),
  });
}

export function useCreateTask() {
  return useMutation({
    mutationFn: (dto: CreateTaskDTO) => createTaskLocal(dto),
  });
}

export function useUpdateTask() {
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateTaskDTO }) => updateTaskLocal(id, dto),
  });
}

export function useDeleteTask() {
  return useMutation({
    mutationFn: (taskId: string) => deleteTaskLocal(taskId),
  });
}

export function useAddChecklistItem() {
  return useMutation({
    mutationFn: ({ taskId, title }: { taskId: string; title: string }) =>
      addChecklistItemLocal(taskId, title),
  });
}

export function useUpdateChecklistItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      itemId,
      dto,
    }: {
      taskId: string;
      itemId: string;
      dto: { title?: string; completed?: boolean };
    }) => updateChecklistItemLocal(itemId, dto),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

export function useDeleteChecklistItem() {
  return useMutation({
    mutationFn: ({ itemId }: { taskId: string; itemId: string }) =>
      deleteChecklistItemLocal(itemId),
  });
}
