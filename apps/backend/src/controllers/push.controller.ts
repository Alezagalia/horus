/**
 * Push Notification Controller
 * Sprint 12 - US-105 + US-107
 */

import { Request, Response } from 'express';
import * as pushService from '../services/push/push-notification.service.js';
import {
  registerTokenSchema,
  unregisterTokenSchema,
  sendTestPushSchema,
} from '../validations/push.validation.js';
import { env } from '../config/env.js';

/**
 * POST /api/push/register
 * Registra o actualiza un token de dispositivo
 */
export async function registerToken(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;

    // Validar body
    const validatedData = registerTokenSchema.parse(req.body);

    // Registrar token
    const pushToken = await pushService.registerToken({
      userId,
      ...validatedData,
    });

    res.status(200).json({
      message: 'Token registered successfully',
      pushToken: {
        id: pushToken.id,
        platform: pushToken.platform,
        deviceName: pushToken.deviceName,
        active: pushToken.active,
        createdAt: pushToken.createdAt,
      },
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
      return;
    }

    console.error('Error registering token:', error);
    res.status(500).json({
      error: 'Failed to register token',
      message: error.message,
    });
  }
}

/**
 * POST /api/push/unregister
 * Desactiva un token de dispositivo
 */
export async function unregisterToken(req: Request, res: Response): Promise<void> {
  try {
    // Validar body
    const validatedData = unregisterTokenSchema.parse(req.body);

    // Desactivar token
    await pushService.unregisterToken(validatedData.token);

    res.status(200).json({
      message: 'Token unregistered successfully',
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
      return;
    }

    console.error('Error unregistering token:', error);
    res.status(500).json({
      error: 'Failed to unregister token',
      message: error.message,
    });
  }
}

/**
 * GET /api/push/tokens
 * Obtiene todos los tokens activos del usuario autenticado
 */
export async function getUserTokens(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;

    const tokens = await pushService.getUserTokens(userId);

    res.status(200).json({
      tokens: tokens.map((t) => ({
        id: t.id,
        platform: t.platform,
        deviceName: t.deviceName,
        deviceId: t.deviceId,
        appVersion: t.appVersion,
        active: t.active,
        lastUsedAt: t.lastUsedAt,
        createdAt: t.createdAt,
      })),
    });
  } catch (error: any) {
    console.error('Error getting user tokens:', error);
    res.status(500).json({
      error: 'Failed to get tokens',
      message: error.message,
    });
  }
}

/**
 * POST /api/push/test
 * Envía una notificación de prueba al usuario autenticado
 * Solo disponible en desarrollo
 */
export async function sendTestPush(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;

    // Solo permitir en desarrollo
    if (process.env.NODE_ENV === 'production') {
      res.status(403).json({
        error: 'Test push notifications are only available in development',
      });
      return;
    }

    // Validar body
    const validatedData = sendTestPushSchema.parse(req.body);

    // Enviar notificación
    const result = await pushService.sendToUser({
      userId,
      title: validatedData.title,
      body: validatedData.body,
      data: validatedData.data,
      imageUrl: validatedData.imageUrl,
    });

    res.status(200).json({
      message: 'Test push sent',
      result: {
        success: result.success,
        sentCount: result.sentCount,
        failedCount: result.failedCount,
        errors: result.errors,
      },
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
      return;
    }

    console.error('Error sending test push:', error);
    res.status(500).json({
      error: 'Failed to send test push',
      message: error.message,
    });
  }
}

/**
 * GET /api/push/vapid-public-key
 * Retorna la VAPID public key para Web Push
 * Sprint 12 - US-107
 */
export async function getVapidPublicKey(_req: Request, res: Response): Promise<void> {
  try {
    const publicKey = env.VAPID_PUBLIC_KEY || '';

    if (!publicKey) {
      res.status(503).json({
        error: 'VAPID keys not configured',
        message: 'Web Push Notifications are not available. Please configure VAPID keys.',
      });
      return;
    }

    res.status(200).json({
      publicKey,
    });
  } catch (error: any) {
    console.error('Error getting VAPID public key:', error);
    res.status(500).json({
      error: 'Failed to get VAPID public key',
      message: error.message,
    });
  }
}
