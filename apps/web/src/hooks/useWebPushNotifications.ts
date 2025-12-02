/**
 * useWebPushNotifications Hook
 * Sprint 12 - US-107
 *
 * Hook para manejar Web Push Notifications con Service Worker
 */

import { useState, useEffect, useCallback } from 'react';

const VAPID_PUBLIC_KEY_ENDPOINT = '/api/push/vapid-public-key';
const REGISTER_ENDPOINT = '/api/push/register';

export type NotificationPermission = 'default' | 'granted' | 'denied';

export interface WebPushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface UseWebPushNotificationsReturn {
  permission: NotificationPermission;
  subscription: WebPushSubscription | null;
  isSupported: boolean;
  isLoading: boolean;
  error: Error | null;
  requestPermission: () => Promise<void>;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
}

/**
 * Verifica si el navegador soporta Web Push Notifications
 */
function isWebPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

/**
 * Convierte base64 URL-safe a Uint8Array para VAPID key
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

/**
 * Hook para manejar Web Push Notifications
 *
 * Flujo:
 * 1. Verifica soporte del navegador
 * 2. Registra service worker
 * 3. Solicita permisos de notificaciones
 * 4. Suscribe al push service con VAPID keys
 * 5. Envía subscription al backend
 *
 * @returns Estado y métodos de web push
 */
export function useWebPushNotifications(): UseWebPushNotificationsReturn {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<WebPushSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const isSupported = isWebPushSupported();

  // Inicializar: Verificar permission y subscription existente
  useEffect(() => {
    if (!isSupported) {
      console.log('[WebPush] Not supported in this browser');
      return;
    }

    // Get current permission
    setPermission(Notification.permission as NotificationPermission);

    // Check for existing subscription
    checkExistingSubscription();
  }, [isSupported]);

  /**
   * Verifica si ya existe una suscripción
   */
  const checkExistingSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const pushSubscription = await registration.pushManager.getSubscription();

      if (pushSubscription) {
        const subscriptionData = pushSubscription.toJSON();
        setSubscription({
          endpoint: subscriptionData.endpoint!,
          keys: {
            p256dh: subscriptionData.keys!.p256dh!,
            auth: subscriptionData.keys!.auth!,
          },
        });
      }
    } catch (err) {
      console.error('[WebPush] Error checking existing subscription:', err);
    }
  };

  /**
   * Solicita permisos de notificaciones al usuario
   */
  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      throw new Error('Web Push Notifications are not supported in this browser');
    }

    try {
      setIsLoading(true);
      setError(null);

      const result = await Notification.requestPermission();
      setPermission(result as NotificationPermission);

      if (result === 'granted') {
        console.log('[WebPush] Permission granted');
        // Auto-subscribe after permission granted
        await subscribe();
      } else {
        console.log('[WebPush] Permission denied or dismissed');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to request permission');
      setError(error);
      console.error('[WebPush] Error requesting permission:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  /**
   * Suscribe al servicio de push notifications
   */
  const subscribe = useCallback(async () => {
    if (!isSupported) {
      throw new Error('Web Push Notifications are not supported');
    }

    if (Notification.permission !== 'granted') {
      throw new Error('Notification permission not granted');
    }

    try {
      setIsLoading(true);
      setError(null);

      // 1. Register service worker
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/',
      });

      console.log('[WebPush] Service Worker registered:', registration);

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;

      // 2. Get VAPID public key from backend
      const vapidResponse = await fetch(VAPID_PUBLIC_KEY_ENDPOINT);
      if (!vapidResponse.ok) {
        throw new Error('Failed to get VAPID public key');
      }
      const { publicKey } = await vapidResponse.json();

      // 3. Subscribe to push service
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });

      const subscriptionData = pushSubscription.toJSON();

      const webPushSubscription: WebPushSubscription = {
        endpoint: subscriptionData.endpoint!,
        keys: {
          p256dh: subscriptionData.keys!.p256dh!,
          auth: subscriptionData.keys!.auth!,
        },
      };

      setSubscription(webPushSubscription);
      console.log('[WebPush] Subscribed:', webPushSubscription);

      // 4. Send subscription to backend
      await sendSubscriptionToBackend(webPushSubscription);

      console.log('[WebPush] ✅ Successfully subscribed and registered');
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to subscribe');
      setError(error);
      console.error('[WebPush] Error subscribing:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  /**
   * Desuscribe del servicio de push notifications
   */
  const unsubscribe = useCallback(async () => {
    if (!isSupported) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const registration = await navigator.serviceWorker.ready;
      const pushSubscription = await registration.pushManager.getSubscription();

      if (pushSubscription) {
        await pushSubscription.unsubscribe();
        setSubscription(null);
        console.log('[WebPush] Unsubscribed');

        // TODO: Notify backend to remove subscription
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to unsubscribe');
      setError(error);
      console.error('[WebPush] Error unsubscribing:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  /**
   * Envía la subscription al backend
   */
  const sendSubscriptionToBackend = async (sub: WebPushSubscription) => {
    try {
      const response = await fetch(REGISTER_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // TODO: Add authorization header
        },
        body: JSON.stringify({
          token: sub.endpoint,
          platform: 'WEB' as const,
          subscription: sub,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to register subscription with backend');
      }

      console.log('[WebPush] Subscription registered with backend');
    } catch (err) {
      console.error('[WebPush] Error sending subscription to backend:', err);
      throw err;
    }
  };

  return {
    permission,
    subscription,
    isSupported,
    isLoading,
    error,
    requestPermission,
    subscribe,
    unsubscribe,
  };
}
