import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventApi } from '@/services/api/eventApi';
import { categoryApi } from '@/services/api/categoryApi';
import type { CreateEventDTO, UpdateEventDTO } from '@/services/api/eventApi';
import type { CreateRecurringExpenseDTO, UpdateRecurringExpenseDTO } from '@horus/shared';
import { useWatermelonQuery } from './useWatermelonQuery';
import { listRecurringExpensesLocal } from '@/db/moneyQueries';
import {
  createRecurringExpenseLocal,
  updateRecurringExpenseLocal,
  deleteRecurringExpenseLocal,
} from '@/db/moneyWrites';

export const eventKeys = {
  all: ['events'] as const,
  upcoming: (days?: number) => [...eventKeys.all, 'upcoming', days] as const,
};

export const calendarEventKeys = {
  all: ['calendar-events'] as const,
  range: (from: string, to: string) => ['calendar-events', 'range', from, to] as const,
};

export const recurringKeys = {
  all: ['recurringExpenses'] as const,
  active: () => [...recurringKeys.all, 'active'] as const,
};

export function useUpcomingEvents(days = 3) {
  return useQuery({
    queryKey: eventKeys.upcoming(days),
    queryFn: () => eventApi.listUpcoming(days),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCalendarEvents(from: string, to: string) {
  return useQuery({
    queryKey: calendarEventKeys.range(from, to),
    queryFn: () => eventApi.list(from, to),
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateEventDTO) => eventApi.create(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: calendarEventKeys.all });
      qc.invalidateQueries({ queryKey: eventKeys.all });
    },
  });
}

export function useUpdateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateEventDTO }) => eventApi.update(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: calendarEventKeys.all });
      qc.invalidateQueries({ queryKey: eventKeys.all });
    },
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => eventApi.del(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: calendarEventKeys.all });
      qc.invalidateQueries({ queryKey: eventKeys.all });
    },
  });
}

export function useEventCategories() {
  return useQuery({
    queryKey: ['categories', 'eventos'],
    queryFn: () => categoryApi.listByScope('eventos'),
    staleTime: 1000 * 60 * 10,
  });
}

/** Offline-first: cuenta plantillas activas desde WatermelonDB. */
export function useRecurringExpensesCount() {
  return useWatermelonQuery(
    recurringKeys.active(),
    async () => (await listRecurringExpensesLocal(true)).length,
    ['recurring_expenses']
  );
}

/** Offline-first: lee de WatermelonDB. La instancia mensual de una plantilla
 * creada offline la genera el server y llega en el próximo pull. */
export function useRecurringExpenses(activeOnly?: boolean) {
  return useWatermelonQuery(
    [...recurringKeys.all, 'list', activeOnly] as const,
    () => listRecurringExpensesLocal(activeOnly),
    ['recurring_expenses', 'categories']
  );
}

export function useCreateRecurringExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateRecurringExpenseDTO) => createRecurringExpenseLocal(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: recurringKeys.all }),
  });
}

export function useUpdateRecurringExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateRecurringExpenseDTO }) =>
      updateRecurringExpenseLocal(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: recurringKeys.all }),
  });
}

export function useDeleteRecurringExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteRecurringExpenseLocal(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: recurringKeys.all }),
  });
}
