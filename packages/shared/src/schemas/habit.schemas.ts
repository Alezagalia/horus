/**
 * Habit Validation Schemas - Shared across Backend, Mobile, and Web
 * Sprint 3 - US-026 (TECH-001)
 */

import { z } from 'zod';

/**
 * HabitType enum schema for Zod validation
 */
export const habitTypeSchema = z.enum(['CHECK', 'NUMERIC']);

/**
 * Periodicity enum schema for Zod validation
 */
export const periodicitySchema = z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM']);

/**
 * TimeOfDay enum schema for Zod validation
 */
export const timeOfDaySchema = z.enum(['MANANA', 'TARDE', 'NOCHE', 'ANYTIME']);

/**
 * Create Habit Schema
 * Used for validating habit creation requests
 */
export const createHabitSchema = z
  .object({
    categoryId: z.string().uuid('Category ID must be a valid UUID'),
    name: z
      .string()
      .min(1, 'Name is required')
      .max(100, 'Name must be 100 characters or less')
      .trim(),
    description: z
      .string()
      .max(500, 'Description must be 500 characters or less')
      .trim()
      .optional(),
    type: habitTypeSchema,
    targetValue: z.number().int().positive().optional(),
    unit: z.string().max(20).trim().optional(),
    periodicity: periodicitySchema.optional().default('DAILY'),
    weekDays: z
      .array(z.number().int().min(0).max(6))
      .max(7, 'Maximum 7 weekdays')
      .optional()
      .default([]),
    timeOfDay: timeOfDaySchema.optional().default('ANYTIME'),
    reminderTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Reminder time must be in HH:mm format')
      .optional(),
    color: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color (e.g., #FF5733)')
      .optional(),
    order: z.number().int().min(0).optional().default(0),
    isActive: z.boolean().optional().default(true),
  })
  .refine(
    (data) => {
      // If type is NUMERIC, targetValue is required
      if (data.type === 'NUMERIC' && !data.targetValue) {
        return false;
      }
      return true;
    },
    {
      message: 'Target value is required for NUMERIC habits',
      path: ['targetValue'],
    }
  )
  .refine(
    (data) => {
      // If periodicity is WEEKLY or CUSTOM, weekDays should not be empty
      if (
        (data.periodicity === 'WEEKLY' || data.periodicity === 'CUSTOM') &&
        data.weekDays &&
        data.weekDays.length === 0
      ) {
        return false;
      }
      return true;
    },
    {
      message: 'At least one weekday must be selected for WEEKLY or CUSTOM periodicity',
      path: ['weekDays'],
    }
  );

/**
 * Update Habit Schema
 * Used for validating habit update requests
 */
export const updateHabitSchema = z
  .object({
    categoryId: z.string().uuid('Category ID must be a valid UUID').optional(),
    name: z
      .string()
      .min(1, 'Name is required')
      .max(100, 'Name must be 100 characters or less')
      .trim()
      .optional(),
    description: z
      .string()
      .max(500, 'Description must be 500 characters or less')
      .trim()
      .optional(),
    type: habitTypeSchema.optional(),
    targetValue: z.number().int().positive().optional(),
    unit: z.string().max(20).trim().optional(),
    periodicity: periodicitySchema.optional(),
    weekDays: z.array(z.number().int().min(0).max(6)).max(7, 'Maximum 7 weekdays').optional(),
    timeOfDay: timeOfDaySchema.optional(),
    reminderTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Reminder time must be in HH:mm format')
      .optional(),
    color: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color (e.g., #FF5733)')
      .optional(),
    order: z.number().int().min(0).optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) => {
      // If type is NUMERIC and targetValue is being updated, ensure it's provided
      if (data.type === 'NUMERIC' && data.targetValue === undefined) {
        // This is a partial update, so we can't enforce this here
        // The backend should validate with existing data
        return true;
      }
      return true;
    },
    {
      message: 'Target value is required for NUMERIC habits',
      path: ['targetValue'],
    }
  );

/**
 * Get Habits Query Schema
 * Used for validating query parameters
 */
export const getHabitsQuerySchema = z.object({
  categoryId: z.string().uuid('Category ID must be a valid UUID').optional(),
});

/**
 * Type inference from schemas
 */
export type CreateHabitInput = z.infer<typeof createHabitSchema>;
export type UpdateHabitInput = z.infer<typeof updateHabitSchema>;
export type GetHabitsQuery = z.infer<typeof getHabitsQuerySchema>;
