/**
 * Google Calendar Sync Service
 * Sprint 8 - US-072
 *
 * Handles communication with backend sync endpoints
 */

const API_URL = 'http://localhost:3000/api'; // TODO: Move to environment config

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
 * Get authentication token from storage
 * TODO: Implement actual token storage/retrieval
 */
const getAuthToken = async (): Promise<string> => {
  // TODO: Get from AsyncStorage or secure store
  return 'mock-token';
};

/**
 * Get Google Calendar connection status
 */
export const getGoogleCalendarStatus = async (): Promise<GoogleSyncStatus> => {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/sync/google-calendar/status`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get sync status');
    }

    const data = await response.json();
    return {
      isConnected: data.isConnected,
      email: data.email,
      lastSync: data.lastSync,
      autoSync: data.autoSync,
    };
  } catch (error) {
    console.error('Error getting Google Calendar status:', error);
    throw error;
  }
};

/**
 * Get Google OAuth authorization URL
 */
export const getGoogleAuthUrl = async (): Promise<string> => {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/sync/google-calendar/connect`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get authorization URL');
    }

    const data = await response.json();
    return data.authUrl;
  } catch (error) {
    console.error('Error getting Google auth URL:', error);
    throw error;
  }
};

/**
 * Complete OAuth flow with authorization code
 */
export const completeGoogleAuth = async (code: string): Promise<void> => {
  try {
    const token = await getAuthToken();
    const response = await fetch(
      `${API_URL}/sync/google-calendar/callback?code=${encodeURIComponent(code)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to complete authorization');
    }
  } catch (error) {
    console.error('Error completing Google auth:', error);
    throw error;
  }
};

/**
 * Disconnect Google Calendar
 */
export const disconnectGoogleCalendar = async (): Promise<void> => {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/sync/google-calendar/disconnect`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to disconnect Google Calendar');
    }
  } catch (error) {
    console.error('Error disconnecting Google Calendar:', error);
    throw error;
  }
};

/**
 * Trigger manual sync from Google Calendar
 */
export const syncFromGoogle = async (): Promise<SyncResult> => {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/sync/google-calendar/sync`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to sync from Google Calendar');
    }

    const data = await response.json();
    return {
      imported: data.imported || 0,
      updated: data.updated || 0,
      deleted: data.deleted || 0,
    };
  } catch (error) {
    console.error('Error syncing from Google Calendar:', error);
    throw error;
  }
};
