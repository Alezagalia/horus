/**
 * React Query Hooks for Habits
 * Sprint 11 - US-098, US-099
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  getHabits,
  getHabitById,
  createHabit,
  updateHabit,
  deleteHabit,
  reactivateHabit,
  createOrUpdateRecord,
  getRecordByDate,
  getRecordsByDateRange,
  updateProgress,
  getHabitStats,
  reorderHabits,
  type GetHabitsFilters,
  type CreateHabitRecordDTO,
  type HabitFromAPI,
  type TimeOfDay,
} from '@/services/api/habitApi';
import type { HabitFormData } from '@/types/habits';

// ==================== Query Keys ====================

export const habitKeys = {
  all: ['habits'] as const,
  lists: () => [...habitKeys.all, 'list'] as const,
  list: (filters?: GetHabitsFilters) => [...habitKeys.lists(), filters] as const,
  details: () => [...habitKeys.all, 'detail'] as const,
  detail: (id: string) => [...habitKeys.details(), id] as const,
  records: (habitId: string) => [...habitKeys.all, 'records', habitId] as const,
  record: (habitId: string, date: string) => [...habitKeys.records(habitId), date] as const,
  recordRange: (habitId: string, startDate: string, endDate: string) =>
    [...habitKeys.records(habitId), 'range', startDate, endDate] as const,
  stats: () => [...habitKeys.all, 'stats'] as const,
  habitStats: (habitId: string) => [...habitKeys.all, 'habitStats', habitId] as const,
};

// ==================== Queries ====================

/**
 * Hook para obtener todos los hábitos con filtros opcionales
 */
export function useHabits(filters?: GetHabitsFilters) {
  return useQuery({
    queryKey: habitKeys.list(filters),
    queryFn: () => getHabits(filters),
    staleTime: 1000 * 30, // 30 segundos - refresh más frecuente para hábitos del día
  });
}

/**
 * Hook para obtener un hábito por ID
 */
export function useHabit(id: string | undefined) {
  return useQuery({
    queryKey: habitKeys.detail(id!),
    queryFn: () => getHabitById(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Hook para obtener el registro de un hábito para una fecha específica
 */
export function useHabitRecord(habitId: string | undefined, date: string | undefined) {
  return useQuery({
    queryKey: habitKeys.record(habitId!, date!),
    queryFn: () => getRecordByDate(habitId!, date!),
    enabled: !!habitId && !!date,
    staleTime: 1000 * 60, // 1 minuto
  });
}

/**
 * Hook para obtener registros de un hábito en un rango de fechas
 */
export function useHabitRecords(habitId: string | undefined, startDate: string, endDate: string) {
  return useQuery({
    queryKey: habitKeys.recordRange(habitId!, startDate, endDate),
    queryFn: () => getRecordsByDateRange(habitId!, startDate, endDate),
    enabled: !!habitId,
    staleTime: 1000 * 60,
  });
}

/**
 * Hook para obtener estadísticas generales de hábitos
 */
export function useHabitStats() {
  return useQuery({
    queryKey: habitKeys.stats(),
    queryFn: () => getHabitStats(),
    staleTime: 1000 * 60, // 1 minuto
  });
}

// ==================== Mutations ====================

/**
 * Hook para crear un nuevo hábito
 */
export function useCreateHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: HabitFormData) => createHabit(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: habitKeys.lists() });
      queryClient.invalidateQueries({ queryKey: habitKeys.stats() });
      toast.success('Hábito creado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al crear hábito: ${error.message}`);
    },
  });
}

/**
 * Hook para actualizar un hábito
 */
export function useUpdateHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<HabitFormData> }) => updateHabit(id, data),
    onSuccess: (updatedHabit) => {
      queryClient.invalidateQueries({ queryKey: habitKeys.lists() });
      queryClient.invalidateQueries({ queryKey: habitKeys.detail(updatedHabit.id) });
      toast.success('Hábito actualizado');
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar hábito: ${error.message}`);
    },
  });
}

/**
 * Hook para eliminar un hábito (soft delete)
 */
export function useDeleteHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteHabit(id),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: habitKeys.lists() });
      queryClient.removeQueries({ queryKey: habitKeys.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: habitKeys.stats() });
      toast.success('Hábito eliminado');
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar hábito: ${error.message}`);
    },
  });
}

/**
 * Hook para reactivar un hábito
 */
export function useReactivateHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => reactivateHabit(id, reason),
    onSuccess: (reactivatedHabit) => {
      queryClient.invalidateQueries({ queryKey: habitKeys.lists() });
      queryClient.invalidateQueries({ queryKey: habitKeys.detail(reactivatedHabit.id) });
      queryClient.invalidateQueries({ queryKey: habitKeys.stats() });
      toast.success('Hábito reactivado');
    },
    onError: (error: Error) => {
      toast.error(`Error al reactivar hábito: ${error.message}`);
    },
  });
}

/**
 * Hook para marcar un hábito como completado/no completado
 */
export function useToggleHabitComplete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ habitId, data }: { habitId: string; data: CreateHabitRecordDTO }) => {
      console.log('useToggleHabitComplete mutationFn called', { habitId, data });
      return createOrUpdateRecord(habitId, data);
    },
    onSuccess: (record) => {
      console.log('useToggleHabitComplete onSuccess', record);
      // Invalidar y refetch queries relacionadas inmediatamente
      queryClient.invalidateQueries({ queryKey: habitKeys.lists(), refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: habitKeys.records(record.habitId), refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: habitKeys.stats(), refetchType: 'all' });

      if (record.completed) {
        toast.success('Hábito completado', { icon: '✅' });
      }
    },
    onError: (error: Error) => {
      console.error('useToggleHabitComplete onError', error);
      toast.error(`Error: ${error.message}`);
    },
  });
}

/**
 * Hook para actualizar progreso de hábito NUMERIC
 */
export function useUpdateHabitProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ habitId, date, increment }: { habitId: string; date: string; increment: number }) =>
      updateProgress(habitId, date, increment),
    onSuccess: (result, { habitId }) => {
      queryClient.invalidateQueries({ queryKey: habitKeys.lists() });
      queryClient.invalidateQueries({ queryKey: habitKeys.records(habitId) });
      queryClient.invalidateQueries({ queryKey: habitKeys.stats() });

      if (result.autoCompleted) {
        toast.success('¡Meta alcanzada!', { icon: '🎉' });
      }
    },
    onError: (error: Error) => {
      toast.error(`Error: ${error.message}`);
    },
  });
}

/**
 * Hook para reordenar hábitos dentro de un momento del día
 */
export function useReorderHabits() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ timeOfDay, habitIds }: { timeOfDay: TimeOfDay; habitIds: string[] }) =>
      reorderHabits({ timeOfDay, habitIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: habitKeys.lists() });
    },
    onError: (error: Error) => {
      toast.error(`Error al reordenar: ${error.message}`);
    },
  });
}

// ==================== Helper function to transform API habit to frontend format ====================

export function transformHabitFromAPI(habit: HabitFromAPI) {
  return {
    id: habit.id,
    name: habit.name,
    description: habit.description ?? undefined,
    type: habit.type,
    targetValue: habit.targetValue ?? undefined,
    unit: habit.unit ?? undefined,
    periodicity: habit.periodicity,
    weekDays: habit.weekDays ?? [],
    timeOfDay: habit.timeOfDay,
    categoryId: habit.categoryId,
    categoryName: habit.category?.name || '',
    categoryIcon: habit.category?.icon ?? undefined,
    categoryColor: habit.category?.color ?? undefined,
    color: habit.color ?? undefined,
    currentStreak: habit.currentStreak,
    longestStreak: habit.longestStreak,
    isActive: habit.isActive,
    createdAt: habit.createdAt,
  };
}
