import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { habitApi, type CreateHabitDTO, type UpdateHabitDTO } from '@/services/api/habitApi';
import { listHabitsLocal, getHabitStatsLocal } from '@/db/habitQueries';
import { listCategoriesLocal } from '@/db/moneyQueries';
import {
  createHabitLocal,
  updateHabitLocal,
  deleteHabitLocal,
  setHabitRecordLocal,
} from '@/db/habitWrites';
import { useWatermelonQuery } from './useWatermelonQuery';
import { goalKeys } from './useGoals';

/**
 * Hooks de Hábitos — offline-first Fase 2: lecturas y escrituras sobre
 * WatermelonDB (habits, habit_records, categories scope `habitos`), replicadas
 * vía /api/replication. Solo las stats detalladas (heatmap del modal) siguen
 * siendo REST. Misma interfaz que la versión REST: las pantallas no cambian.
 */

export const habitKeys = {
  all: ['habits'] as const,
  list: () => [...habitKeys.all, 'list'] as const,
  stats: () => [...habitKeys.all, 'stats'] as const,
  detail: (id: string) => [...habitKeys.all, 'detail', id] as const,
};

const HABIT_TABLES = ['habits', 'habit_records', 'categories'];

export function useHabits(date?: string) {
  return useWatermelonQuery(
    date ? [...habitKeys.list(), date] : habitKeys.list(),
    () => listHabitsLocal(date),
    HABIT_TABLES
  );
}

export function useHabitStats() {
  return useWatermelonQuery(
    habitKeys.stats(),
    // TODAY se resuelve en cada lectura (no congelar el día al montar)
    () => getHabitStatsLocal(format(new Date(), 'yyyy-MM-dd')),
    ['habits', 'habit_records']
  );
}

/** Stats detalladas (heatmap 30d, tasas): siguen siendo REST — las calcula el
 * server desde el historial completo; requieren red (pantalla de consulta). */
export function useHabitDetailedStats(habitId: string) {
  return useQuery({
    queryKey: habitKeys.detail(habitId),
    queryFn: () => habitApi.getDetailedStats(habitId),
    staleTime: 5 * 60 * 1000,
    enabled: !!habitId,
  });
}

export function useHabitCategories() {
  return useWatermelonQuery(['categories', 'habitos'], () => listCategoriesLocal('habitos'), [
    'categories',
  ]);
}

export function useToggleHabitComplete() {
  const queryClient = useQueryClient();
  return useMutation({
    // Escritura local instantánea (sin update optimista de React Query: el
    // observable de Watermelon invalida y relee de SQLite al toque)
    mutationFn: ({
      habitId,
      date,
      completed,
    }: {
      habitId: string;
      date: string;
      completed: boolean;
    }) => setHabitRecordLocal({ habitId, date, completed }),
    onSettled: (_data, _err, variables) => {
      if (variables.completed) {
        // Los KRs vinculados los incrementa el server al procesar el push;
        // la invalidación refresca metas cuando vuelva la respuesta REST.
        queryClient.invalidateQueries({ queryKey: goalKeys.all });
      }
    },
  });
}

export function useCreateHabit() {
  return useMutation({
    mutationFn: (dto: CreateHabitDTO) => createHabitLocal(dto),
  });
}

export function useUpdateHabit() {
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateHabitDTO }) => updateHabitLocal(id, dto),
  });
}

export function useDeleteHabit() {
  return useMutation({
    mutationFn: (id: string) => deleteHabitLocal(id),
  });
}

export function useNumericHabitProgress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ habitId, date, value }: { habitId: string; date: string; value: number }) =>
      setHabitRecordLocal({ habitId, date, completed: true, value }),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: goalKeys.all });
    },
  });
}
