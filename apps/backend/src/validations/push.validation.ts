/**
 * Push Notification Validations
 * Sprint 12 - US-105
 */

import { z } from 'zod';
import { DevicePlatform } from '../generated/prisma/client.js';

/**
 * Schema para registrar token de dispositivo
 */
export const registerTokenSchema = z.object({
  token: z
    .string()
    .min(20, 'Token must be at least 20 characters')
    .max(500, 'Token must be at most 500 characters'),
  platform: z.nativeEnum(DevicePlatform),
  deviceName: z.string().max(100).optional(),
  deviceId: z.string().max(100).optional(),
  appVersion: z.string().max(20).optional(),
});

/**
 * Schema para desregistrar token
 */
export const unregisterTokenSchema = z.object({
  token: z.string().min(20).max(500),
});

/**
 * Schema para enviar notificación de prueba
 */
export const sendTestPushSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1),
  data: z.record(z.string(), z.string()).optional(),
  imageUrl: z.string().url().optional(),
});

export type RegisterTokenDTO = z.infer<typeof registerTokenSchema>;
export type UnregisterTokenDTO = z.infer<typeof unregisterTokenSchema>;
export type SendTestPushDTO = z.infer<typeof sendTestPushSchema>;
