/**
 * NotificationService - Sistema de Notificaciones Locales
 * Sprint 6 - US-055
 *
 * Servicio centralizado para gestionar notificaciones de hábitos con Expo Notifications
 * Funcionalidades:
 * - Programar notificaciones diarias recurrentes
 * - Verificar si hábito está completado antes de mostrar
 * - Cancelar notificaciones al desactivar/eliminar hábito
 * - Deep linking al tocar notificación
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// ==================== Configuration ====================

/**
 * Configure notification handler
 * Controls how notifications are displayed when app is in foreground
 */
Notifications.setNotificationHandler({
  handleNotification: async (_notification) => {
    // TODO US-055: Check if habit is already completed before showing
    // For now, always show notification
    // const habitId = notification.request.content.data?.habitId as string | undefined;
    // const date = notification.request.content.data?.date as string | undefined;
    // if (habitId && date) {
    //   const isCompleted = await checkHabitCompletedForDate(habitId, date);
    //   if (isCompleted) return { shouldShowAlert: false, shouldPlaySound: false, shouldSetBadge: false };
    // }

    // Show notification
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    };
  },
});

// ==================== Helper Functions ====================

/**
 * Check if habit is completed for a specific date
 * This will make an API call to verify the habit status
 * TODO US-055: Implement this function when needed
 */
// Commented out for now - will be implemented in future iteration
// async function checkHabitCompletedForDate(_habitId: string, _date: string): Promise<boolean> {
//   try {
//     // TODO: Import and use getHabitRecordByDate from habits.api
//     // For now, return false to always show notification
//     // This will be implemented when integrating with the API
//     return false;
//   } catch (error) {
//     console.error('Error checking habit completion status:', error);
//     return false;
//   }
// }

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayDate(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

/**
 * Generate unique notification identifier for a habit
 */
function getNotificationIdentifier(habitId: string): string {
  return `habit_${habitId}`;
}

// ==================== Public API ====================

/**
 * Request notification permissions
 * US-054 already implements this, but we expose it here for consistency
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();

    if (existingStatus === 'granted') {
      return true;
    }

    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
}

/**
 * Schedule a daily recurring notification for a habit
 * US-055: Core notification scheduling
 *
 * @param habitId - Unique identifier for the habit
 * @param habitName - Name of the habit to display in notification
 * @param time - Time in HH:mm format (e.g., "08:00", "14:30")
 * @returns Notification identifier or null if scheduling failed
 */
export async function scheduleHabitNotification(
  habitId: string,
  habitName: string,
  time: string
): Promise<string | null> {
  try {
    // Cancel existing notification for this habit
    await cancelHabitNotification(habitId);

    // Parse time
    const [hours, minutes] = time.split(':').map(Number);

    // Validate time
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      console.error('Invalid time format:', time);
      return null;
    }

    // Schedule daily notification
    const notificationId = await Notifications.scheduleNotificationAsync({
      identifier: getNotificationIdentifier(habitId),
      content: {
        title: '🔔 Recordatorio de hábito',
        body: `${habitName} - ¡No olvides completarlo hoy!`,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: {
          habitId,
          date: getTodayDate(),
          type: 'habit_reminder',
        },
        // Android specific
        ...(Platform.OS === 'android' && {
          categoryIdentifier: 'habit_reminder',
          color: '#2196F3',
          vibrate: [0, 250, 250, 250],
        }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour: hours,
        minute: minutes,
        repeats: true,
      },
    });

    console.log(`Notification scheduled for habit ${habitId} at ${time} - ID: ${notificationId}`);
    return notificationId;
  } catch (error) {
    console.error('Error scheduling habit notification:', error);
    return null;
  }
}

/**
 * Cancel all scheduled notifications for a habit
 * US-055: Called when habit is deleted or notification is disabled
 *
 * @param habitId - Unique identifier for the habit
 */
export async function cancelHabitNotification(habitId: string): Promise<void> {
  try {
    const identifier = getNotificationIdentifier(habitId);

    // Cancel by identifier
    await Notifications.cancelScheduledNotificationAsync(identifier);

    console.log(`Cancelled notifications for habit ${habitId}`);
  } catch (error) {
    console.error('Error cancelling habit notification:', error);
  }
}

/**
 * Cancel all scheduled notifications
 * Useful for debugging or user-initiated "clear all notifications" action
 */
export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('Cancelled all scheduled notifications');
  } catch (error) {
    console.error('Error cancelling all notifications:', error);
  }
}

/**
 * Get all scheduled notifications
 * Useful for debugging
 */
export async function getAllScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    return [];
  }
}

/**
 * Set notification categories (Android)
 * US-055: Configure notification channels
 */
export async function setupNotificationCategories(): Promise<void> {
  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('habit_reminder', {
        name: 'Recordatorios de Hábitos',
        description: 'Notificaciones para recordarte completar tus hábitos diarios',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2196F3',
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: false,
      });

      console.log('Notification categories configured for Android');
    } catch (error) {
      console.error('Error setting up notification categories:', error);
    }
  }
}

/**
 * Register for notification received listener
 * US-055: Handle notifications when app is in foreground
 *
 * @param handler - Function to call when notification is received
 * @returns Subscription object
 */
export function addNotificationReceivedListener(
  handler: (notification: Notifications.Notification) => void
): Notifications.Subscription {
  return Notifications.addNotificationReceivedListener(handler);
}

/**
 * Register for notification response listener
 * US-055: Handle when user taps on notification (deep linking)
 *
 * @param handler - Function to call when notification is tapped
 * @returns Subscription object
 */
export function addNotificationResponseReceivedListener(
  handler: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(handler);
}

/**
 * Get the last notification response (useful for handling initial deep link)
 */
export async function getLastNotificationResponse(): Promise<Notifications.NotificationResponse | null> {
  try {
    return await Notifications.getLastNotificationResponseAsync();
  } catch (error) {
    console.error('Error getting last notification response:', error);
    return null;
  }
}
