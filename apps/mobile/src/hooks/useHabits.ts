import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { habitApi } from '@/services/api/habitApi';

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
