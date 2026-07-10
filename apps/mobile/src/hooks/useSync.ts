import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';
import { syncApi } from '@/services/api/syncApi';
import { calendarEventKeys } from './useEvents';

export const syncKeys = {
  all: ['sync'] as const,
  status: () => [...syncKeys.all, 'google-calendar-status'] as const,
};

export function useSyncStatus() {
  return useQuery({
    queryKey: syncKeys.status(),
    queryFn: syncApi.getStatus,
    staleTime: 30 * 1000,
  });
}

/** El deep link al que vuelve la página de callback web (flujo mobile). */
const OAUTH_REDIRECT = 'horus://google-callback';

export function useConnectGoogleCalendar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<'success' | 'error' | 'cancel'> => {
      const authUrl = await syncApi.getConnectUrl();
      // openAuthSessionAsync intercepta el redirect horus://google-callback:
      // el navegador se cierra solo al volver (a diferencia de openBrowserAsync,
      // que dejaba el flujo sin retorno y el usuario tenía que cerrarlo a mano)
      const result = await WebBrowser.openAuthSessionAsync(authUrl, OAUTH_REDIRECT);
      if (result.type !== 'success') return 'cancel';
      // Parse simple del deep link (URL/URLSearchParams es frágil en RN/Hermes)
      if (!result.url.includes('status=success')) {
        throw new Error('Google rechazó la conexión');
      }
      return 'success';
    },
    onSettled: () => {
      // Refetch status after browser closes (success, error or cancel)
      queryClient.invalidateQueries({ queryKey: syncKeys.status() });
    },
  });
}

export function useDisconnectGoogleCalendar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: syncApi.disconnect,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: syncKeys.status() });
    },
  });
}

export function useTriggerSync() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: syncApi.triggerSync,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: syncKeys.status() });
      queryClient.invalidateQueries({ queryKey: calendarEventKeys.all });
    },
  });
}
