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

export function useConnectGoogleCalendar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const authUrl = await syncApi.getConnectUrl();
      await WebBrowser.openBrowserAsync(authUrl, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
      });
    },
    onSettled: () => {
      // Refetch status after browser closes (success or cancel)
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
