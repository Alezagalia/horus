import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateEventDTO, UpdateEventDTO } from '@/services/api/eventApi';
import type { CreateRecurringExpenseDTO, UpdateRecurringExpenseDTO } from '@horus/shared';
import { useWatermelonQuery } from './useWatermelonQuery';
import { listRecurringExpensesLocal, listCategoriesLocal } from '@/db/moneyQueries';
import {
  createRecurringExpenseLocal,
  updateRecurringExpenseLocal,
  deleteRecurringExpenseLocal,
} from '@/db/moneyWrites';
import { listUpcomingEventsLocal, listCalendarEventsLocal } from '@/db/eventQueries';
import { createEventLocal, updateEventLocal, deleteEventLocal } from '@/db/eventWrites';

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

// Offline-first Fase 2c: los eventos se leen/escriben en WatermelonDB. Las
// instancias recurrentes son filas que genera el server (llegan por pull);
// el sync con Google lo resuelve el server al procesar el push.

export function useUpcomingEvents(days = 3) {
  return useWatermelonQuery(eventKeys.upcoming(days), () => listUpcomingEventsLocal(days), [
    'events',
    'categories',
  ]);
}

export function useCalendarEvents(from: string, to: string) {
  return useWatermelonQuery(
    calendarEventKeys.range(from, to),
    () => listCalendarEventsLocal(from, to),
    ['events', 'categories']
  );
}

export function useCreateEvent() {
  return useMutation({
    mutationFn: (dto: CreateEventDTO) => createEventLocal(dto),
  });
}

export function useUpdateEvent() {
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateEventDTO }) => updateEventLocal(id, dto),
  });
}

export function useDeleteEvent() {
  return useMutation({
    mutationFn: (id: string) => deleteEventLocal(id),
  });
}

export function useEventCategories() {
  return useWatermelonQuery(['categories', 'eventos'], () => listCategoriesLocal('eventos'), [
    'categories',
  ]);
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
