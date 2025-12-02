/**
 * Notification Validation Schemas
 * Sprint 6 - US-051
 */

import { z } from 'zod';

/**
 * Validation schema for notification configuration
 * Validates time format HH:mm with valid ranges (00:00 - 23:59)
 */
export const updateNotificationConfigSchema = z.object({
  enabled: z.boolean(),
  time: z
    .string()
    .regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in format HH:mm (00:00 - 23:59)'),
});
