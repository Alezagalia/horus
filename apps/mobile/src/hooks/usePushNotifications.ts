/**
 * usePushNotifications Hook
 * Sprint 12 - US-106
 *
 * Hook para inicializar y manejar notificaciones push en la app
 */

import { useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { useNavigation } from '@react-navigation/native';
import {
  registerForPushNotifications,
  clearBadge,
  canReceivePushNotifications,
} from '../services/push-notifications';

export interface NotificationData {
  type?: string;
  habitId?: string;
  habitName?: string;
  taskId?: string;
  eventId?: string;
  [key: string]: any;
}

export interface UsePushNotificationsReturn {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  isRegistered: boolean;
  error: Error | null;
}

/**
 * Hook para manejar push notifications
 *
 * Funcionalidades:
 * - Registra el dispositivo automáticamente al montar
 * - Escucha notificaciones recibidas (foreground)
 * - Maneja tap en notificaciones (deep linking)
 * - Limpia listeners al desmontar
 *
 * @returns Estado de push notifications
 */
export function usePushNotifications(): UsePushNotificationsReturn {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const navigation = useNavigation();

  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    // Solo intentar registrar en dispositivos físicos
    if (!canReceivePushNotifications()) {
      console.log('Push notifications not available on this device');
      return;
    }

    // Registrar dispositivo para push notifications
    registerForPushNotifications()
      .then((token) => {
        if (token) {
          setExpoPushToken(token);
          setIsRegistered(true);
          console.log('✅ Push notifications registered successfully');
        }
      })
      .catch((err) => {
        console.error('❌ Failed to register push notifications:', err);
        setError(err);
      });

    // Listener: Notificación recibida mientras app está en foreground
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log('📬 Notification received (foreground):', notification);
      setNotification(notification);

      // Opcional: Mostrar toast o actualizar UI
    });

    // Listener: Usuario toca la notificación
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('👆 Notification tapped:', response);

      const data = response.notification.request.content.data as NotificationData;

      // Deep linking basado en el tipo de notificación
      handleNotificationNavigation(data);

      // Limpiar badge al abrir notificación
      clearBadge();
    });

    // Cleanup: Remover listeners al desmontar
    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Maneja la navegación cuando se toca una notificación
   */
  const handleNotificationNavigation = (data: NotificationData) => {
    try {
      switch (data.type) {
        case 'habit_reminder':
          if (data.habitId) {
            // Navegar a la screen de hábitos con highlight
            // @ts-ignore - Navigation types are dynamic
            navigation.navigate('Habits', {
              screen: 'HabitsList',
              params: {
                highlightHabitId: data.habitId,
              },
            });
          }
          break;

        case 'task_reminder':
          if (data.taskId) {
            // @ts-ignore - Navigation types are dynamic
            navigation.navigate('Tasks', {
              highlightTaskId: data.taskId,
            });
          }
          break;

        case 'event_reminder':
          if (data.eventId) {
            // @ts-ignore - Navigation types are dynamic
            navigation.navigate('Calendar', {
              highlightEventId: data.eventId,
            });
          }
          break;

        default:
          // Navegar a home por defecto
          // @ts-ignore - Navigation types are dynamic
          navigation.navigate('Home');
          break;
      }
    } catch (error) {
      console.error('Error navigating from notification:', error);
    }
  };

  return {
    expoPushToken,
    notification,
    isRegistered,
    error,
  };
}
