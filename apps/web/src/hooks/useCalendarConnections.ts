/**
 * Calendar Connections React Query Hooks
 * Sprint 15 - Multi-Calendar Support
 *
 * Hooks for Microsoft Calendar connection management.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  getMicrosoftCalendarStatus,
  connectMicrosoftCalendar,
  disconnectMicrosoftCalendar,
  syncMicrosoftCalendar,
  type CalendarSyncResult,
} from '@/services/api/calendarConnectionApi';
import { calendarEventKeys } from './useCalendarEvents';

export const microsoftCalendarKeys = {
  all: ['microsoft-calendar'] as const,
  status: () => [...microsoftCalendarKeys.all, 'status'] as const,
};

/**
 * Get Microsoft Calendar connection status
 */
export function useMicrosoftCalendarStatus() {
  return useQuery({
    queryKey: microsoftCalendarKeys.status(),
    queryFn: getMicrosoftCalendarStatus,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });
}

/**
 * Connect Microsoft Calendar (initiate OAuth flow)
 */
export function useConnectMicrosoftCalendar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: connectMicrosoftCalendar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: microsoftCalendarKeys.status() });
    },
    onError: (error: Error) => {
      toast.error(`Error al conectar con Microsoft: ${error.message}`);
    },
  });
}

/**
 * Disconnect Microsoft Calendar
 */
export function useDisconnectMicrosoftCalendar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: disconnectMicrosoftCalendar,
    onSuccess: (data) => {
      toast.success(data.message || 'Microsoft Calendar desconectado');
      queryClient.invalidateQueries({ queryKey: microsoftCalendarKeys.status() });
      queryClient.invalidateQueries({ queryKey: calendarEventKeys.all });
    },
    onError: (error: Error) => {
      toast.error(`Error al desconectar: ${error.message}`);
    },
  });
}

/**
 * Sync from Microsoft Calendar
 */
export function useSyncMicrosoftCalendar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: syncMicrosoftCalendar,
    onSuccess: (data: CalendarSyncResult) => {
      if (data.success) {
        const total = (data.eventsImported || 0) + (data.eventsUpdated || 0);
        toast.success(
          total > 0
            ? `${total} evento${total > 1 ? 's' : ''} sincronizado${total > 1 ? 's' : ''}`
            : 'Sincronización completada'
        );
        queryClient.invalidateQueries({ queryKey: calendarEventKeys.all });
        queryClient.invalidateQueries({ queryKey: microsoftCalendarKeys.status() });
      } else {
        toast.error(data.message || 'Error en la sincronización');
      }
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      const isAuthError =
        error.response?.status === 401 ||
        error.message?.includes('expired') ||
        error.message?.includes('reconnect');

      if (isAuthError) {
        toast.error(
          'Tu conexión con Microsoft Calendar ha expirado. Por favor reconecta tu cuenta.'
        );
        queryClient.invalidateQueries({ queryKey: microsoftCalendarKeys.status() });
      } else {
        toast.error(`Error al sincronizar: ${error.message || 'Error desconocido'}`);
      }
    },
  });
}
