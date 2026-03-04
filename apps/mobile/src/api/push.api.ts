/**
 * Push Notifications API Client
 * Sprint 12 - US-106
 */

// Sprint 1: Use centralized axios instance with auth interceptors
import { apiClient as api } from '../lib/axios';

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
