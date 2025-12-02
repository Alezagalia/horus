/**
 * Google Calendar React Query Hooks
 * Sprint 13 - US-118
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  getGoogleCalendarStatus,
  connectGoogleCalendar,
  disconnectGoogleCalendar,
  syncGoogleCalendar,
  type GoogleCalendarSyncResult,
} from '@/services/api/googleCalendarApi';
import { calendarEventKeys } from './useCalendarEvents';

export const googleCalendarKeys = {
  all: ['google-calendar'] as const,
  status: () => [...googleCalendarKeys.all, 'status'] as const,
};

/**
 * Get Google Calendar connection status
 */
export function useGoogleCalendarStatus() {
  return useQuery({
    queryKey: googleCalendarKeys.status(),
    queryFn: getGoogleCalendarStatus,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });
}

/**
 * Connect Google Calendar (initiate OAuth flow)
 */
export function useConnectGoogleCalendar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: connectGoogleCalendar,
    onSuccess: () => {
      // Status will be updated after OAuth callback completes
      queryClient.invalidateQueries({ queryKey: googleCalendarKeys.status() });
    },
    onError: (error: Error) => {
      toast.error(`Error al conectar: ${error.message}`);
    },
  });
}

/**
 * Disconnect Google Calendar
 */
export function useDisconnectGoogleCalendar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: disconnectGoogleCalendar,
    onSuccess: (data) => {
      toast.success(data.message || 'Google Calendar desconectado');
      queryClient.invalidateQueries({ queryKey: googleCalendarKeys.status() });
      // Refresh calendar events to remove Google events
      queryClient.invalidateQueries({ queryKey: calendarEventKeys.all });
    },
    onError: (error: Error) => {
      toast.error(`Error al desconectar: ${error.message}`);
    },
  });
}

/**
 * Sync from Google Calendar
 */
export function useSyncGoogleCalendar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: syncGoogleCalendar,
    onSuccess: (data: GoogleCalendarSyncResult) => {
      if (data.success) {
        const imported = data.eventsImported || 0;
        const updated = data.eventsUpdated || 0;
        const total = imported + updated;

        toast.success(
          total > 0
            ? `${total} evento${total > 1 ? 's' : ''} sincronizado${total > 1 ? 's' : ''}`
            : 'Sincronización completada'
        );

        // Refresh calendar events
        queryClient.invalidateQueries({ queryKey: calendarEventKeys.all });
        // Update last sync time
        queryClient.invalidateQueries({ queryKey: googleCalendarKeys.status() });
      } else {
        toast.error(data.message || 'Error en la sincronización');
      }
    },
    onError: (error: Error) => {
      toast.error(`Error al sincronizar: ${error.message}`);
    },
  });
}
