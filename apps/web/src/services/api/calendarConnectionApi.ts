/**
 * Calendar Connection API Service
 * Sprint 15 - Multi-Calendar Support
 */

import { axiosInstance } from '@/lib/axios';

export interface MicrosoftCalendarStatus {
  isConnected: boolean;
  email?: string | null;
  lastSyncAt?: string | null;
  needsReconnect?: boolean;
}

export interface CalendarSyncResult {
  success: boolean;
  message: string;
  eventsImported?: number;
  eventsUpdated?: number;
  eventsDeleted?: number;
}

/**
 * Initiate Microsoft Calendar OAuth connection
 * Returns the authorization URL to open in popup
 */
export async function connectMicrosoftCalendar(): Promise<{ authUrl: string }> {
  const response = await axiosInstance.post<{ success: boolean; authUrl: string }>(
    '/calendar-connections/microsoft/connect'
  );
  return { authUrl: response.data.authUrl };
}

/**
 * Get Microsoft Calendar connection status
 */
export async function getMicrosoftCalendarStatus(): Promise<MicrosoftCalendarStatus> {
  const response = await axiosInstance.get<{ success: boolean; data: MicrosoftCalendarStatus }>(
    '/calendar-connections/microsoft/status'
  );
  return response.data.data;
}

/**
 * Disconnect Microsoft Calendar
 */
export async function disconnectMicrosoftCalendar(): Promise<{
  success: boolean;
  message: string;
}> {
  const response = await axiosInstance.post<{ success: boolean; message: string }>(
    '/calendar-connections/microsoft/disconnect'
  );
  return response.data;
}

/**
 * Manually trigger synchronization from Microsoft Calendar
 */
export async function syncMicrosoftCalendar(): Promise<CalendarSyncResult> {
  const response = await axiosInstance.post<CalendarSyncResult>(
    '/calendar-connections/microsoft/sync',
    {},
    { timeout: 60000 }
  );
  return response.data;
}
