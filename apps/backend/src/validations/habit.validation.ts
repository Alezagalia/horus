/**
 * Habit Validation Schemas
 * Sprint 3 - US-021
 */

import { z } from 'zod';

export const habitTypeEnum = z.enum(['CHECK', 'NUMERIC']);
export const periodicityEnum = z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM']);
export const timeOfDayEnum = z.enum(['AYUNO', 'MANANA', 'MEDIA_MANANA', 'TARDE', 'MEDIA_TARDE', 'NOCHE', 'ANTES_DORMIR', 'ANYTIME']);

export const createHabitSchema = z
  .object({
    categoryId: z.string().uuid('Category ID must be a valid UUID'),
    name: z.string().min(1, 'Name is required').max(100).trim(),
    description: z.string().max(500).optional(),
    type: habitTypeEnum,
    targetValue: z.number().int().positive().optional(),
    unit: z.string().max(20).optional(),
    periodicity: periodicityEnum.default('DAILY'),
    weekDays: z.array(z.number().int().min(0).max(6)).default([]),
    timeOfDay: timeOfDayEnum.default('ANYTIME'),
    reminderTime: z
      .string()
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .optional(),
    color: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color (e.g., #FF5733)')
      .optional(),
    order: z.number().int().min(0).default(0),
  })
  .refine(
    (data) => {
      if (data.type === 'NUMERIC' && !data.targetValue) {
        return false;
      }
      return true;
    },
    {
      message: 'targetValue is required for NUMERIC habits',
      path: ['targetValue'],
    }
  )
  .refine(
    (data) => {
      if (data.periodicity === 'WEEKLY' && data.weekDays.length === 0) {
        return false;
      }
      return true;
    },
    {
      message: 'weekDays is required for WEEKLY periodicity',
      path: ['weekDays'],
    }
  );

export const updateHabitSchema = z
  .object({
    categoryId: z.string().uuid('Category ID must be a valid UUID').optional(),
    name: z.string().min(1, 'Name is required').max(100).trim().optional(),
    description: z.string().max(500).optional().nullable(),
    type: habitTypeEnum.optional(),
    targetValue: z.number().int().positive().optional().nullable(),
    unit: z.string().max(20).optional().nullable(),
    periodicity: periodicityEnum.optional(),
    weekDays: z.array(z.number().int().min(0).max(6)).optional(),
    timeOfDay: timeOfDayEnum.optional(),
    reminderTime: z
      .string()
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .optional()
      .nullable(),
    color: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color (e.g., #FF5733)')
      .optional()
      .nullable(),
    order: z.number().int().min(0).optional(),
  })
  .refine(
    (data) => {
      if (data.type === 'NUMERIC' && data.targetValue === null) {
        return false;
      }
      return true;
    },
    {
      message: 'targetValue cannot be null for NUMERIC habits',
      path: ['targetValue'],
    }
  );

export const getHabitsQuerySchema = z.object({
  categoryId: z.string().uuid().optional(),
});

/**
 * Validation schema for audit history query params
 * Sprint 6 - US-048
 */
export const getAuditHistorySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 50))
    .pipe(z.number().int().min(1).max(100)),
});

/**
 * Validation schema for habit reactivation
 * Sprint 6 - US-049
 */
export const reactivateHabitSchema = z.object({
  reason: z.string().max(500).optional(),
});
