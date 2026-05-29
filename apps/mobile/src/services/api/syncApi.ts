import { axiosInstance } from '../axios';

export interface SyncStatus {
  isConnected: boolean;
  googleEmail: string | null;
  lastSyncAt: string | null;
  hasValidToken: boolean;
  needsReconnect: boolean;
}

export interface SyncResult {
  success: boolean;
  message: string;
  eventsImported: number;
  eventsUpdated: number;
  eventsDeleted: number;
}

export const syncApi = {
  getStatus: async (): Promise<SyncStatus> => {
    const { data } = await axiosInstance.get('/sync/google-calendar/status');
    return data.data ?? data;
  },

  getConnectUrl: async (): Promise<string> => {
    const { data } = await axiosInstance.post('/sync/google-calendar/connect');
    return data.authUrl;
  },

  disconnect: async (): Promise<void> => {
    await axiosInstance.post('/sync/google-calendar/disconnect');
  },

  triggerSync: async (): Promise<SyncResult> => {
    const { data } = await axiosInstance.post('/sync/google-calendar/sync');
    return data;
  },
};
