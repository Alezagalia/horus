/**
 * React Query Hooks for Tasks
 * Sprint 11 - US-101
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  toggleTaskComplete,
  toggleChecklistItem,
  type GetTasksFilters,
} from '@/services/api/taskApi';
import type { Task, TaskFormData } from '@/types/tasks';

// ==================== Query Keys ====================

export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (filters?: GetTasksFilters) => [...taskKeys.lists(), filters] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
};

// ==================== Queries ====================

/**
 * Hook para obtener todas las tareas con filtros opcionales
 */
export function useTasks(filters?: GetTasksFilters) {
  return useQuery({
    queryKey: taskKeys.list(filters),
    queryFn: () => getTasks(filters),
    staleTime: 1000 * 60, // 1 minuto
    // Desactivar structural sharing para forzar nuevas referencias en optimistic updates
    structuralSharing: false,
  });
}

/**
 * Hook para obtener una tarea por ID
 */
export function useTask(id: string | undefined) {
  return useQuery({
    queryKey: taskKeys.detail(id!),
    queryFn: () => getTaskById(id!),
    enabled: !!id,
    staleTime: 1000 * 60, // 1 minuto
  });
}

// ==================== Mutations ====================

/**
 * Hook para crear una nueva tarea
 */
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TaskFormData) => createTask(data),
    onSuccess: () => {
      // Invalidar todas las listas de tareas para refrescarlas
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      toast.success('Tarea creada', { icon: '✨' });
    },
    onError: (error: Error) => {
      toast.error(`Error al crear tarea: ${error.message}`);
    },
  });
}

/**
 * Hook para actualizar una tarea
 */
export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TaskFormData> }) => updateTask(id, data),
    onSuccess: (updatedTask) => {
      // Invalidar listas y detalles
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(updatedTask.id) });
      toast.success('Tarea actualizada', { icon: '✏️' });
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar tarea: ${error.message}`);
    },
  });
}

/**
 * Hook para eliminar una tarea
 */
export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onSuccess: (_, deletedId) => {
      // Invalidar todas las listas
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      // Remover del cache el detalle eliminado
      queryClient.removeQueries({ queryKey: taskKeys.detail(deletedId) });
      toast.success('Tarea eliminada');
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar tarea: ${error.message}`);
    },
  });
}

/**
 * Hook para alternar el estado de completado de una tarea
 * Con optimistic update para mejor UX
 */
export function useToggleTaskComplete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => toggleTaskComplete(id),
    // Optimistic update
    onMutate: async (taskId) => {
      // Cancelar queries en progreso
      await queryClient.cancelQueries({ queryKey: taskKeys.lists() });

      // Snapshot del estado anterior
      const previousTasks = queryClient.getQueriesData({ queryKey: taskKeys.lists() });

      // Optimistically update todas las listas
      queryClient.setQueriesData<Task[]>({ queryKey: taskKeys.lists() }, (old) => {
        if (!old) return old;
        return old.map((task) => {
          if (task.id === taskId) {
            return {
              ...task,
              status: task.completedAt ? ('pending' as const) : ('completed' as const),
              completedAt: task.completedAt ? undefined : new Date().toISOString(),
            };
          }
          return task;
        });
      });

      return { previousTasks };
    },
    onSuccess: (updatedTask) => {
      // Actualizar el cache con los datos reales del servidor
      queryClient.setQueriesData<Task[]>({ queryKey: taskKeys.lists() }, (old) => {
        if (!old) return old;
        return old.map((task) => (task.id === updatedTask.id ? updatedTask : task));
      });
      queryClient.setQueryData(taskKeys.detail(updatedTask.id), updatedTask);

      // Toast con mensaje personalizado
      toast.success(
        updatedTask.completedAt
          ? `${updatedTask.title} completada!`
          : `${updatedTask.title} marcada como pendiente`
      );
    },
    onError: (error: Error, _, context) => {
      // Rollback en caso de error
      if (context?.previousTasks) {
        context.previousTasks.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error(`Error: ${error.message}`);
    },
  });
}

/**
 * Hook para alternar un item del checklist
 * Con optimistic update - usando setQueriesData como en useToggleTaskComplete
 */
export function useToggleChecklistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      taskId,
      itemId,
      currentCompleted,
    }: {
      taskId: string;
      itemId: string;
      currentCompleted: boolean;
    }) => toggleChecklistItem(taskId, itemId, currentCompleted),
    // Optimistic update usando setQueriesData (igual que useToggleTaskComplete)
    onMutate: async ({ taskId, itemId }) => {
      // Cancelar queries en progreso para evitar que sobrescriban nuestro update
      await queryClient.cancelQueries({ queryKey: taskKeys.lists() });

      // Snapshot del estado anterior
      const previousTasks = queryClient.getQueriesData({ queryKey: taskKeys.lists() });

      // Optimistically update todas las listas usando setQueriesData
      queryClient.setQueriesData<Task[]>({ queryKey: taskKeys.lists() }, (old) => {
        if (!old) return old;
        return old.map((task) => {
          if (task.id === taskId) {
            return {
              ...task,
              checklist: task.checklist.map((item) =>
                item.id === itemId ? { ...item, completed: !item.completed } : item
              ),
            };
          }
          return task;
        });
      });

      return { previousTasks };
    },
    // NO invalidamos en onSuccess - el optimistic update ya hizo el trabajo
    onError: (error: Error, _, context) => {
      // Rollback en caso de error
      if (context?.previousTasks) {
        context.previousTasks.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error(`Error: ${error.message}`);
    },
  });
}
