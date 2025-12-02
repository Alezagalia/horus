/**
 * Push Notifications API Client
 * Sprint 12 - US-106
 */

import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

// TODO: Get token from secure storage (AsyncStorage/SecureStore)
const getAuthToken = () => {
  return 'dummy-token-for-development';
};

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface RegisterTokenInput {
  token: string;
  platform: 'IOS' | 'ANDROID' | 'WEB';
  deviceName?: string;
  deviceId?: string;
  appVersion?: string;
}

export interface PushToken {
  id: string;
  platform: 'IOS' | 'ANDROID' | 'WEB';
  deviceName?: string;
  deviceId?: string;
  appVersion?: string;
  active: boolean;
  lastUsedAt?: string;
  createdAt: string;
}

/**
 * Register or update device push token
 */
export async function registerPushToken(input: RegisterTokenInput): Promise<PushToken> {
  const response = await api.post('/push/register', input);
  return response.data.pushToken;
}

/**
 * Unregister device push token
 */
export async function unregisterPushToken(token: string): Promise<void> {
  await api.post('/push/unregister', { token });
}

/**
 * Get all user's active push tokens
 */
export async function getUserPushTokens(): Promise<PushToken[]> {
  const response = await api.get('/push/tokens');
  return response.data.tokens;
}
