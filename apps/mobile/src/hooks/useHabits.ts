import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { habitApi, type CreateHabitDTO, type UpdateHabitDTO } from '@/services/api/habitApi';
import { categoryApi } from '@/services/api/categoryApi';

export const habitKeys = {
  all: ['habits'] as const,
  list: () => [...habitKeys.all, 'list'] as const,
  stats: () => [...habitKeys.all, 'stats'] as const,
};

export function useHabits() {
  return useQuery({
    queryKey: habitKeys.list(),
    queryFn: habitApi.list,
    staleTime: 1000 * 60 * 3,
  });
}

export function useHabitStats() {
  return useQuery({
    queryKey: habitKeys.stats(),
    queryFn: habitApi.getStats,
    staleTime: 1000 * 60,
  });
}

export function useHabitCategories() {
  return useQuery({
    queryKey: ['categories', 'habitos'],
    queryFn: () => categoryApi.listByScope('habitos'),
    staleTime: 1000 * 60 * 10,
  });
}

export function useToggleHabitComplete() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      habitId,
      date,
      completed,
    }: {
      habitId: string;
      date: string;
      completed: boolean;
    }) => habitApi.toggleRecord(habitId, date, completed),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: habitKeys.list() });
      queryClient.invalidateQueries({ queryKey: habitKeys.stats() });
    },
  });
}

export function useCreateHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateHabitDTO) => habitApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: habitKeys.all });
    },
  });
}

export function useUpdateHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateHabitDTO }) => habitApi.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: habitKeys.all });
    },
  });
}

export function useDeleteHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => habitApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: habitKeys.all });
    },
  });
}

export function useNumericHabitProgress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ habitId, date, value }: { habitId: string; date: string; value: number }) =>
      habitApi.updateNumericProgress(habitId, date, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: habitKeys.list() });
      queryClient.invalidateQueries({ queryKey: habitKeys.stats() });
    },
  });
}
