/**
 * Google Calendar API Service
 * Sprint 13 - US-118
 */

import { axiosInstance } from '@/lib/axios';

export interface GoogleCalendarStatus {
  isConnected: boolean;
  googleEmail?: string;
  lastSyncAt?: string;
  hasValidToken?: boolean;
  needsReconnect?: boolean;
}

export interface GoogleCalendarSyncResult {
  success: boolean;
  message: string;
  eventsImported?: number;
  eventsUpdated?: number;
  eventsDeleted?: number;
}

/**
 * Initiate Google Calendar OAuth connection
 * Returns the authorization URL to open in popup
 */
export async function connectGoogleCalendar(): Promise<{ authUrl: string }> {
  const response = await axiosInstance.post<{ success: boolean; authUrl: string }>(
    '/sync/google-calendar/connect'
  );
  return { authUrl: response.data.authUrl };
}

/**
 * Get Google Calendar connection status
 */
export async function getGoogleCalendarStatus(): Promise<GoogleCalendarStatus> {
  const response = await axiosInstance.get<{ success: boolean; data: GoogleCalendarStatus }>(
    '/sync/google-calendar/status'
  );
  return response.data.data;
}

/**
 * Disconnect Google Calendar
 */
export async function disconnectGoogleCalendar(): Promise<{ success: boolean; message: string }> {
  const response = await axiosInstance.post<{ success: boolean; message: string }>(
    '/sync/google-calendar/disconnect'
  );
  return response.data;
}

/**
 * Manually trigger synchronization from Google Calendar
 */
export async function syncGoogleCalendar(): Promise<GoogleCalendarSyncResult> {
  const response = await axiosInstance.post<GoogleCalendarSyncResult>(
    '/sync/google-calendar/sync',
    {},
    {
      timeout: 60000, // 60 seconds for sync operation (can take time with many events)
    }
  );
  return response.data;
}
