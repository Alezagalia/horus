/**
 * Push Notification Service
 * Sprint 12 - US-105
 *
 * Servicio para gestionar tokens de dispositivos y enviar notificaciones push via FCM
 */

import { DevicePlatform } from '../../generated/prisma/client.js';
import { getMessaging, isFirebaseConfigured } from '@/lib/firebase-admin.js';
import type { Message, MulticastMessage } from 'firebase-admin/messaging';
import { prisma } from '../../lib/prisma.js';

export interface RegisterTokenInput {
  userId: string;
  token: string;
  platform: DevicePlatform;
  deviceName?: string;
  deviceId?: string;
  appVersion?: string;
}

export interface SendPushInput {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

export interface SendPushToTokenInput {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

/**
 * Registra o actualiza un token de dispositivo para un usuario
 */
export async function registerToken(input: RegisterTokenInput) {
  const { userId, token, platform, deviceName, deviceId, appVersion } = input;

  try {
    // Verificar si el token ya existe
    const existingToken = await prisma.pushToken.findUnique({
      where: { token },
    });

    if (existingToken) {
      // Si el token existe pero pertenece a otro usuario, actualizar el userId
      // (caso de reinstalación de app en el mismo dispositivo)
      if (existingToken.userId !== userId) {
        const updated = await prisma.pushToken.update({
          where: { token },
          data: {
            userId,
            platform,
            deviceName,
            deviceId,
            appVersion,
            active: true,
            updatedAt: new Date(),
          },
        });
        return updated;
      }

      // Si es del mismo usuario, solo actualizar metadatos
      const updated = await prisma.pushToken.update({
        where: { token },
        data: {
          platform,
          deviceName,
          deviceId,
          appVersion,
          active: true,
          updatedAt: new Date(),
        },
      });
      return updated;
    }

    // Crear nuevo token
    const pushToken = await prisma.pushToken.create({
      data: {
        userId,
        token,
        platform,
        deviceName,
        deviceId,
        appVersion,
      },
    });

    return pushToken;
  } catch (error) {
    console.error('Error registering push token:', error);
    throw error;
  }
}

/**
 * Desactiva un token (soft delete)
 */
export async function unregisterToken(token: string) {
  try {
    const pushToken = await prisma.pushToken.updateMany({
      where: { token },
      data: {
        active: false,
        updatedAt: new Date(),
      },
    });

    return pushToken;
  } catch (error) {
    console.error('Error unregistering push token:', error);
    throw error;
  }
}

/**
 * Envía una notificación push a todos los dispositivos activos de un usuario
 */
export async function sendToUser(input: SendPushInput): Promise<{
  success: boolean;
  sentCount: number;
  failedCount: number;
  errors: string[];
}> {
  const { userId, title, body, data, imageUrl } = input;

  // Verificar si Firebase está configurado
  if (!isFirebaseConfigured()) {
    console.warn('Firebase not configured. Skipping push notification.');
    return { success: false, sentCount: 0, failedCount: 0, errors: ['Firebase not configured'] };
  }

  try {
    // Obtener todos los tokens activos del usuario
    const tokens = await prisma.pushToken.findMany({
      where: {
        userId,
        active: true,
      },
    });

    if (tokens.length === 0) {
      console.log(`No active tokens found for user ${userId}`);
      return { success: true, sentCount: 0, failedCount: 0, errors: [] };
    }

    const messaging = getMessaging();
    if (!messaging) {
      return {
        success: false,
        sentCount: 0,
        failedCount: 0,
        errors: ['Firebase messaging not available'],
      };
    }

    // Preparar mensaje multicast
    const message: MulticastMessage = {
      notification: {
        title,
        body,
        ...(imageUrl && { imageUrl }),
      },
      data: data || {},
      tokens: tokens.map((t) => t.token),
    };

    // Enviar a todos los tokens
    const response = await messaging.sendEachForMulticast(message);

    // Procesar respuestas y desactivar tokens inválidos
    const failedTokens: string[] = [];
    const errors: string[] = [];

    response.responses.forEach((resp, idx: number) => {
      const token = tokens[idx];

      if (resp.success) {
        // Actualizar lastUsedAt para tokens exitosos
        prisma.pushToken
          .update({
            where: { id: token.id },
            data: { lastUsedAt: new Date() },
          })
          .catch((err: any) => console.error('Error updating lastUsedAt:', err));
      } else {
        // Token inválido, desactivar
        const error = resp.error;
        if (
          error?.code === 'messaging/invalid-registration-token' ||
          error?.code === 'messaging/registration-token-not-registered'
        ) {
          failedTokens.push(token.token);
          prisma.pushToken
            .update({
              where: { id: token.id },
              data: { active: false },
            })
            .catch((err: any) => console.error('Error deactivating token:', err));
        }

        errors.push(`${token.platform}: ${error?.message || 'Unknown error'}`);
      }
    });

    return {
      success: response.successCount > 0,
      sentCount: response.successCount,
      failedCount: response.failureCount,
      errors,
    };
  } catch (error) {
    console.error('Error sending push notification:', error);
    throw error;
  }
}

/**
 * Envía una notificación push a un token específico
 */
export async function sendToToken(input: SendPushToTokenInput): Promise<boolean> {
  const { token, title, body, data, imageUrl } = input;

  // Verificar si Firebase está configurado
  if (!isFirebaseConfigured()) {
    console.warn('Firebase not configured. Skipping push notification.');
    return false;
  }

  try {
    const messaging = getMessaging();
    if (!messaging) {
      return false;
    }

    const message: Message = {
      notification: {
        title,
        body,
        ...(imageUrl && { imageUrl }),
      },
      data: data || {},
      token,
    };

    await messaging.send(message);

    // Actualizar lastUsedAt
    await prisma.pushToken.updateMany({
      where: { token },
      data: { lastUsedAt: new Date() },
    });

    return true;
  } catch (error: any) {
    console.error('Error sending push to token:', error);

    // Si el token es inválido, desactivarlo
    if (
      error?.code === 'messaging/invalid-registration-token' ||
      error?.code === 'messaging/registration-token-not-registered'
    ) {
      await prisma.pushToken.updateMany({
        where: { token },
        data: { active: false },
      });
    }

    return false;
  }
}

/**
 * Envía un recordatorio de hábito programado
 */
export async function sendScheduledHabitReminder(habitId: string, userId: string): Promise<void> {
  try {
    // Obtener información del hábito
    const habit = await prisma.habit.findUnique({
      where: { id: habitId },
      include: { category: true },
    });

    if (!habit) {
      throw new Error(`Habit ${habitId} not found`);
    }

    // Enviar notificación
    const result = await sendToUser({
      userId,
      title: '⏰ Recordatorio de Hábito',
      body: `Es hora de completar: ${habit.name}`,
      data: {
        type: 'habit_reminder',
        habitId: habit.id,
        habitName: habit.name,
      },
    });

    // Guardar notificación en BD
    await prisma.notification.create({
      data: {
        userId,
        type: 'habit_reminder',
        title: '⏰ Recordatorio de Hábito',
        body: `Es hora de completar: ${habit.name}`,
        data: JSON.stringify({
          habitId: habit.id,
          habitName: habit.name,
          categoryId: habit.categoryId,
        }),
        pushSent: result.success,
        pushSentAt: result.success ? new Date() : null,
        pushError: result.errors.length > 0 ? result.errors.join(', ') : null,
      },
    });

    console.log(`Habit reminder sent to user ${userId}:`, result);
  } catch (error) {
    console.error('Error sending habit reminder:', error);
    throw error;
  }
}

/**
 * Obtiene todos los tokens activos de un usuario
 */
export async function getUserTokens(userId: string) {
  return prisma.pushToken.findMany({
    where: {
      userId,
      active: true,
    },
  });
}

/**
 * Elimina todos los tokens de un usuario (hard delete)
 */
export async function deleteUserTokens(userId: string) {
  return prisma.pushToken.deleteMany({
    where: { userId },
  });
}
