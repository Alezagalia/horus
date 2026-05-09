/**
 * Google Calendar Sync Service
 * Sprint 8 - US-072
 *
 * Handles communication with backend sync endpoints using the centralized
 * apiClient (auth token is automatically injected via interceptors).
 */

import { apiClient } from '../lib/axios';

interface GoogleSyncStatus {
  isConnected: boolean;
  email?: string;
  lastSync?: string;
  autoSync?: boolean;
}

interface SyncResult {
  imported: number;
  updated: number;
  deleted: number;
}

/**
 * Get Google Calendar connection status
 */
export const getGoogleCalendarStatus = async (): Promise<GoogleSyncStatus> => {
  const response = await apiClient.get<GoogleSyncStatus>('/sync/google-calendar/status');
  return response.data;
};

/**
 * Get Google OAuth authorization URL
 */
export const getGoogleAuthUrl = async (): Promise<string> => {
  const response = await apiClient.post<{ authUrl: string }>('/sync/google-calendar/connect');
  return response.data.authUrl;
};

/**
 * Complete OAuth flow with authorization code
 */
export const completeGoogleAuth = async (code: string): Promise<void> => {
  await apiClient.get(`/sync/google-calendar/callback?code=${encodeURIComponent(code)}`);
};

/**
 * Disconnect Google Calendar
 */
export const disconnectGoogleCalendar = async (): Promise<void> => {
  await apiClient.post('/sync/google-calendar/disconnect');
};

/**
 * Trigger manual sync from Google Calendar
 */
export const syncFromGoogle = async (): Promise<SyncResult> => {
  const response = await apiClient.post<SyncResult>('/sync/google-calendar/sync');
  return {
    imported: response.data.imported ?? 0,
    updated: response.data.updated ?? 0,
    deleted: response.data.deleted ?? 0,
  };
};
