import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import {
  requestPermissions,
  getNativeToken,
  registerTokenWithBackend,
  unregisterTokenFromBackend,
  setupAndroidChannel,
} from '@/services/push/pushService';

const STORED_TOKEN_KEY = 'horus_push_token';

// ─── deep-link router ─────────────────────────────────────────────────────────

/**
 * Navigate to the appropriate screen based on notification data.
 * The backend should set `data.screen` to one of the values below.
 */
function handleNotificationTap(data: Record<string, unknown>): void {
  const screen = data?.screen as string | undefined;
  switch (screen) {
    case 'habits':
    case 'tasks':
      router.push('/(tabs)/foco');
      break;
    case 'finance':
      router.push('/(tabs)/dinero');
      break;
    case 'events':
      router.push('/agenda');
      break;
    case 'workout':
    case 'routines':
      router.push('/(tabs)/cuerpo');
      break;
    case 'resources':
      router.push('/recursos');
      break;
    default:
      router.push('/(tabs)');
  }
}

// ─── hook ─────────────────────────────────────────────────────────────────────

/**
 * Manages push notification registration and event listeners.
 * Call with `enabled = isAuthenticated` so registration only runs after login.
 */
export function usePushNotifications(enabled: boolean): void {
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    if (!enabled) return;

    // 1. Android channel (no-op on iOS)
    setupAndroidChannel().catch((e) => console.warn('[Push] Channel setup failed:', e));

    // 2. Request permissions and register token
    (async () => {
      try {
        const granted = await requestPermissions();
        if (!granted) {
          console.log('[Push] Permission not granted');
          return;
        }

        const token = await getNativeToken();
        if (!token) {
          // Expected on simulators or when FCM is not configured yet
          console.log('[Push] No native token available (simulator or missing Firebase config)');
          return;
        }

        // Only call the backend when the token changes
        const stored = await SecureStore.getItemAsync(STORED_TOKEN_KEY);
        if (token !== stored) {
          await registerTokenWithBackend(token);
          await SecureStore.setItemAsync(STORED_TOKEN_KEY, token);
          console.log('[Push] Token registered with backend');
        }
      } catch (err) {
        // Non-blocking — push failure should never crash the app
        console.warn('[Push] Registration error:', err);
      }
    })();

    // 3. Handle taps on notifications (foreground or background)
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, unknown>;
      handleNotificationTap(data);
    });

    // 4. Handle the notification that cold-started the app
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response?.notification.request.content.data) {
        handleNotificationTap(
          response.notification.request.content.data as Record<string, unknown>
        );
      }
    });

    return () => {
      responseListener.current?.remove();
      responseListener.current = null;
    };
  }, [enabled]);
}

// ─── logout helper ────────────────────────────────────────────────────────────

/**
 * Call during logout to unregister the device token from the backend
 * and clear it from secure storage.
 */
export async function cleanupPushToken(): Promise<void> {
  try {
    const token = await SecureStore.getItemAsync(STORED_TOKEN_KEY);
    if (token) {
      await unregisterTokenFromBackend(token);
      await SecureStore.deleteItemAsync(STORED_TOKEN_KEY);
    }
  } catch {
    // Silent
  }
}
