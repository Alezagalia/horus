import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventApi } from '@/services/api/eventApi';
import { categoryApi } from '@/services/api/categoryApi';
import { recurringExpenseApi } from '@/services/api/recurringExpenseApi';
import type { CreateEventDTO, UpdateEventDTO } from '@/services/api/eventApi';

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

export function useRecurringExpensesCount() {
  return useQuery({
    queryKey: recurringKeys.active(),
    queryFn: async () => {
      const list = await recurringExpenseApi.listActive();
      return list.length;
    },
    staleTime: 1000 * 60 * 10,
  });
}
