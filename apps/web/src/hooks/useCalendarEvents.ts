/**
 * React Query Hooks for Calendar Events
 * Sprint 13 - US-117
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  getCalendarEvents,
  getCalendarEventById,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  type GetCalendarEventsFilters,
} from '@/services/api/calendarEventApi';
import type { CreateCalendarEventDTO, UpdateCalendarEventDTO } from '@horus/shared';

// ==================== Query Keys ====================

export const calendarEventKeys = {
  all: ['calendar-events'] as const,
  lists: () => [...calendarEventKeys.all, 'list'] as const,
  list: (filters?: GetCalendarEventsFilters) => [...calendarEventKeys.lists(), filters] as const,
  details: () => [...calendarEventKeys.all, 'detail'] as const,
  detail: (id: string) => [...calendarEventKeys.details(), id] as const,
};

// ==================== Queries ====================

/**
 * Hook para obtener eventos de calendario con filtros opcionales
 */
export function useCalendarEvents(filters?: GetCalendarEventsFilters) {
  return useQuery({
    queryKey: calendarEventKeys.list(filters),
    queryFn: () => getCalendarEvents(filters),
    staleTime: 1000 * 60 * 2, // 2 minutos (eventos cambian frecuentemente)
  });
}

/**
 * Hook para obtener un evento por ID
 */
export function useCalendarEvent(id: string | undefined) {
  return useQuery({
    queryKey: calendarEventKeys.detail(id!),
    queryFn: () => getCalendarEventById(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
  });
}

// ==================== Mutations ====================

/**
 * Hook para crear un nuevo evento
 */
export function useCreateCalendarEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCalendarEventDTO) => createCalendarEvent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarEventKeys.lists() });
      toast.success('Evento creado');
    },
    onError: (error: Error) => {
      toast.error(`Error al crear evento: ${error.message}`);
    },
  });
}

/**
 * Hook para actualizar un evento
 */
export function useUpdateCalendarEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCalendarEventDTO }) =>
      updateCalendarEvent(id, data),
    onSuccess: (updatedEvent) => {
      queryClient.invalidateQueries({ queryKey: calendarEventKeys.lists() });
      queryClient.invalidateQueries({ queryKey: calendarEventKeys.detail(updatedEvent.id) });
      toast.success('Evento actualizado');
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar evento: ${error.message}`);
    },
  });
}

/**
 * Hook para eliminar un evento
 */
export function useDeleteCalendarEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCalendarEvent(id),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: calendarEventKeys.lists() });
      queryClient.removeQueries({ queryKey: calendarEventKeys.detail(deletedId) });
      toast.success('Evento eliminado');
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar evento: ${error.message}`);
    },
  });
}
