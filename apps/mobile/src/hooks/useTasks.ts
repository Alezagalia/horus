import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskApi, type CreateTaskDTO, type UpdateTaskDTO } from '@/services/api/taskApi';
import { categoryApi } from '@/services/api/categoryApi';

export const taskKeys = {
  all: ['tasks'] as const,
  list: (filters?: object) => [...taskKeys.all, 'list', filters] as const,
};

export function useTasks(filters?: { status?: string }) {
  return useQuery({
    queryKey: taskKeys.list(filters),
    queryFn: () => taskApi.list(filters),
    staleTime: 1000 * 60,
  });
}

export function useTaskCategories() {
  return useQuery({
    queryKey: ['categories', 'tareas'],
    queryFn: () => categoryApi.listByScope('tareas'),
    staleTime: 1000 * 60 * 10,
  });
}

export function useToggleTaskComplete() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => taskApi.toggle(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateTaskDTO) => taskApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateTaskDTO }) => taskApi.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => taskApi.delete(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

export function useAddChecklistItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, title }: { taskId: string; title: string }) =>
      taskApi.addChecklistItem(taskId, title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

export function useUpdateChecklistItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      taskId,
      itemId,
      dto,
    }: {
      taskId: string;
      itemId: string;
      dto: { title?: string; completed?: boolean };
    }) => taskApi.updateChecklistItem(taskId, itemId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

export function useDeleteChecklistItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, itemId }: { taskId: string; itemId: string }) =>
      taskApi.deleteChecklistItem(taskId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}
