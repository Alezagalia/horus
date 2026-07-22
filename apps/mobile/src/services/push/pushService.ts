/**
 * Push Notification Service — Mobile
 *
 * Uses native FCM tokens (Android) / APNs tokens (iOS) to match the backend's
 * Firebase Admin SDK setup. Expo Push Tokens are intentionally NOT used here.
 *
 * Setup requirements before push can deliver end-to-end:
 *   Android → add google-services.json to project root + configure in app.json
 *   iOS     → Apple Push Notification entitlement + Firebase plist
 *   Both    → real EAS build (Expo Go only supports Expo push tokens, not FCM direct)
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { axiosInstance } from '@/services/axios';

// ─── Notification handler (runs at module-load time) ──────────────────────────
// Controls how notifications are shown when the app is in the foreground.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ─── types ────────────────────────────────────────────────────────────────────

export type DevicePlatform = 'IOS' | 'ANDROID';

// ─── platform ────────────────────────────────────────────────────────────────

export function getDevicePlatform(): DevicePlatform {
  return Platform.OS === 'ios' ? 'IOS' : 'ANDROID';
}

// ─── permissions ──────────────────────────────────────────────────────────────

/**
 * Request notification permissions. Returns true if granted.
 * On iOS this shows the system permission dialog on first call.
 */
export async function requestPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Check the current permission status WITHOUT triggering the system dialog.
 * Lets callers register tokens for users who already granted, while the
 * prompt itself only fires from the onboarding context screen.
 */
export async function hasPermissions(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

// ─── Android notification channel ─────────────────────────────────────────────

/**
 * Create the default notification channel (required for Android 8+).
 * No-op on iOS.
 */
export async function setupAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Horus',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#1E6BFF',
    sound: 'default',
  });
}

// ─── token ────────────────────────────────────────────────────────────────────

/**
 * Retrieve the native FCM (Android) or APNs (iOS) push token.
 * Returns null when running on a simulator or when FCM is not configured.
 */
export async function getNativeToken(): Promise<string | null> {
  try {
    const result = await Notifications.getDevicePushTokenAsync();
    return result.data as string;
  } catch {
    // Simulator, missing google-services.json, etc.
    return null;
  }
}

// ─── backend registration ─────────────────────────────────────────────────────

/**
 * Register the device token with the Horus backend.
 * POST /api/push/register
 */
export async function registerTokenWithBackend(token: string): Promise<void> {
  await axiosInstance.post('/push/register', {
    token,
    platform: getDevicePlatform(),
    appVersion: Constants.expoConfig?.version ?? '1.0.0',
  });
}

/**
 * Unregister the device token from the backend (e.g. on logout).
 * POST /api/push/unregister — silent on failure.
 */
export async function unregisterTokenFromBackend(token: string): Promise<void> {
  try {
    await axiosInstance.post('/push/unregister', { token });
  } catch {
    // Ignore — server may have already cleaned up the token
  }
}
