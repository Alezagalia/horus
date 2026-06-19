import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  habitApi,
  type CreateHabitDTO,
  type UpdateHabitDTO,
  type Habit,
} from '@/services/api/habitApi';
import { categoryApi } from '@/services/api/categoryApi';
import { goalKeys } from './useGoals';

export const habitKeys = {
  all: ['habits'] as const,
  list: () => [...habitKeys.all, 'list'] as const,
  stats: () => [...habitKeys.all, 'stats'] as const,
  detail: (id: string) => [...habitKeys.all, 'detail', id] as const,
};

export function useHabits(date?: string) {
  return useQuery({
    // El date entra en la key para refetchear por día; invalidar habitKeys.list()
    // matchea por prefijo, así que sigue invalidando esta query.
    queryKey: date ? [...habitKeys.list(), date] : habitKeys.list(),
    queryFn: () => habitApi.list(date),
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

export function useHabitDetailedStats(habitId: string) {
  return useQuery({
    queryKey: habitKeys.detail(habitId),
    queryFn: () => habitApi.getDetailedStats(habitId),
    staleTime: 5 * 60 * 1000,
    enabled: !!habitId,
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
    // Update optimista: el check cambia al instante y se revierte si falla de verdad
    // (tras agotar los reintentos de red). Hace inmediato el toggle ante latencia.
    onMutate: async ({ habitId, date, completed }) => {
      const key = [...habitKeys.list(), date];
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Habit[]>(key);
      queryClient.setQueryData<Habit[]>(key, (old) =>
        old?.map((h) =>
          h.id === habitId
            ? {
                ...h,
                records: [
                  {
                    id: h.records?.[0]?.id ?? '',
                    habitId,
                    completed,
                    value: h.records?.[0]?.value ?? null,
                    notes: h.records?.[0]?.notes ?? null,
                  },
                ],
              }
            : h
        )
      );
      return { previous, key };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(ctx.key, ctx.previous);
    },
    onSettled: (_data, _err, variables) => {
      queryClient.invalidateQueries({ queryKey: habitKeys.list() });
      queryClient.invalidateQueries({ queryKey: habitKeys.stats() });
      if (variables.completed) {
        queryClient.invalidateQueries({ queryKey: goalKeys.all });
      }
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
      queryClient.invalidateQueries({ queryKey: goalKeys.all });
    },
  });
}
