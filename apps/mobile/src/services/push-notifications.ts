/**
 * Push Notifications Service
 * Sprint 12 - US-106
 *
 * Maneja el registro de tokens, permisos, y configuración de notificaciones push
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { registerPushToken, unregisterPushToken } from '../api/push.api';

// Configurar cómo se manejan las notificaciones cuando la app está en foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface PushNotificationPermissions {
  granted: boolean;
  canAskAgain: boolean;
  ios?: {
    status: Notifications.IosAuthorizationStatus;
    allowsAlert: boolean;
    allowsBadge: boolean;
    allowsSound: boolean;
  };
}

/**
 * Verifica si el dispositivo puede recibir notificaciones push
 */
export function canReceivePushNotifications(): boolean {
  return Device.isDevice && !Platform.select({ web: true, default: false });
}

/**
 * Obtiene el estado actual de permisos de notificaciones
 */
export async function getNotificationPermissions(): Promise<PushNotificationPermissions> {
  const { status, ios, canAskAgain } = await Notifications.getPermissionsAsync();

  return {
    granted: status === 'granted',
    canAskAgain,
    ios: ios
      ? {
          status: ios.status,
          allowsAlert: ios.allowsAlert ?? false,
          allowsBadge: ios.allowsBadge ?? false,
          allowsSound: ios.allowsSound ?? false,
        }
      : undefined,
  };
}

/**
 * Solicita permisos de notificaciones al usuario
 */
export async function requestNotificationPermissions(): Promise<PushNotificationPermissions> {
  const { status, ios, canAskAgain } = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
      allowAnnouncements: true,
    },
  });

  return {
    granted: status === 'granted',
    canAskAgain,
    ios: ios
      ? {
          status: ios.status,
          allowsAlert: ios.allowsAlert ?? false,
          allowsBadge: ios.allowsBadge ?? false,
          allowsSound: ios.allowsSound ?? false,
        }
      : undefined,
  };
}

/**
 * Configura el canal de notificaciones para Android
 */
export async function setupAndroidNotificationChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Recordatorios de Hábitos',
      description: 'Notificaciones para recordar completar tus hábitos diarios',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2196F3',
      sound: 'default',
      enableVibrate: true,
      enableLights: true,
      showBadge: true,
    });
  }
}

/**
 * Obtiene el Expo Push Token del dispositivo
 */
export async function getExpoPushToken(): Promise<string> {
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

    if (!projectId) {
      console.warn('No Expo project ID found. Using development mode token.');
    }

    const token = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    return token.data;
  } catch (error) {
    console.error('Error getting Expo push token:', error);
    throw error;
  }
}

/**
 * Registra el dispositivo para recibir notificaciones push
 *
 * Flujo completo:
 * 1. Verifica que sea un dispositivo físico
 * 2. Solicita permisos
 * 3. Configura canal Android
 * 4. Obtiene Expo push token
 * 5. Registra token en backend
 *
 * @returns El push token registrado o null si falló
 */
export async function registerForPushNotifications(): Promise<string | null> {
  try {
    // 1. Verificar dispositivo físico
    if (!canReceivePushNotifications()) {
      console.log('Push notifications are not available on this device (emulator or web)');
      return null;
    }

    // 2. Solicitar permisos
    const permissions = await requestNotificationPermissions();

    if (!permissions.granted) {
      console.log('Push notification permissions not granted');
      return null;
    }

    console.log('✅ Push notification permissions granted');

    // 3. Configurar canal Android
    await setupAndroidNotificationChannel();

    // 4. Obtener Expo push token
    const expoPushToken = await getExpoPushToken();
    console.log('📱 Expo Push Token:', expoPushToken);

    // 5. Registrar en backend
    await sendTokenToBackend(expoPushToken);

    return expoPushToken;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
}

/**
 * Envía el token al backend para registrarlo
 */
export async function sendTokenToBackend(token: string): Promise<void> {
  try {
    const platform = Platform.select({
      ios: 'IOS',
      android: 'ANDROID',
      web: 'WEB',
      default: 'WEB',
    }) as 'IOS' | 'ANDROID' | 'WEB';

    const deviceName = Device.deviceName ?? undefined;
    const deviceId = Constants.deviceId ?? undefined;
    const appVersion = Constants.expoConfig?.version ?? undefined;

    const result = await registerPushToken({
      token,
      platform,
      deviceName,
      deviceId,
      appVersion,
    });

    console.log('✅ Push token registered in backend:', result.id);
  } catch (error) {
    console.error('❌ Error sending token to backend:', error);
    throw error;
  }
}

/**
 * Desregistra el token de push notifications
 */
export async function unregisterPushNotifications(token: string): Promise<void> {
  try {
    await unregisterPushToken(token);
    console.log('✅ Push token unregistered from backend');
  } catch (error) {
    console.error('❌ Error unregistering push token:', error);
    throw error;
  }
}

/**
 * Actualiza el badge count de la app
 */
export async function setBadgeCount(count: number): Promise<void> {
  try {
    await Notifications.setBadgeCountAsync(count);
  } catch (error) {
    console.error('Error setting badge count:', error);
  }
}

/**
 * Limpia el badge count (pone a 0)
 */
export async function clearBadge(): Promise<void> {
  await setBadgeCount(0);
}

/**
 * Obtiene el badge count actual
 */
export async function getBadgeCount(): Promise<number> {
  try {
    return await Notifications.getBadgeCountAsync();
  } catch (error) {
    console.error('Error getting badge count:', error);
    return 0;
  }
}

/**
 * Cancela todas las notificaciones programadas
 */
export async function cancelAllScheduledNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('✅ All scheduled notifications cancelled');
  } catch (error) {
    console.error('Error cancelling scheduled notifications:', error);
  }
}

/**
 * Cancela todas las notificaciones entregadas
 */
export async function dismissAllNotifications(): Promise<void> {
  try {
    await Notifications.dismissAllNotificationsAsync();
    console.log('✅ All notifications dismissed');
  } catch (error) {
    console.error('Error dismissing notifications:', error);
  }
}
