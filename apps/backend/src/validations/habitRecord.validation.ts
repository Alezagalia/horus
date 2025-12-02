/**
 * HabitRecord Validation Schemas
 * Sprint 4 - US-029
 */

import { z } from 'zod';

/**
 * Schema for creating/updating a habit record
 * Sprint 4 - US-029, US-030
 */
// Helper to parse YYYY-MM-DD as local date (not UTC)
function parseLocalDate(dateStr: string): Date {
  // If it's already a datetime string, parse directly
  if (dateStr.includes('T')) {
    return new Date(dateStr);
  }
  // For YYYY-MM-DD format, parse as local time to avoid timezone issues
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0); // noon to avoid DST issues
}

export const createHabitRecordSchema = z.object({
  date: z
    .string()
    .datetime()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    .transform((val) => parseLocalDate(val))
    .refine((date) => !isNaN(date.getTime()), {
      message: 'Invalid date format',
    })
    .refine(
      (date) => {
        // Don't allow future dates (US-029)
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        return date <= today;
      },
      {
        message: 'Cannot register completions for future dates',
      }
    )
    .refine(
      (date) => {
        // Don't allow dates more than 7 days in the past (US-030)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);

        const normalizedDate = new Date(date);
        normalizedDate.setHours(0, 0, 0, 0);

        return normalizedDate >= sevenDaysAgo;
      },
      {
        message: 'Cannot register completions for dates more than 7 days in the past',
      }
    )
    .optional()
    .default(() => new Date()),
  completed: z.boolean(),
  value: z.number().positive('Value must be a positive number').optional(),
  notes: z.string().max(500, 'Notes must be 500 characters or less').trim().optional(),
});

/**
 * Schema for getting records by date range
 */
export const getRecordsByDateRangeSchema = z.object({
  startDate: z
    .string()
    .datetime()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    .transform((val) => parseLocalDate(val)),
  endDate: z
    .string()
    .datetime()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    .transform((val) => parseLocalDate(val)),
});

/**
 * Schema for getting a record by specific date
 */
export const getRecordByDateSchema = z.object({
  date: z
    .string()
    .datetime()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    .transform((val) => parseLocalDate(val)),
});

/**
 * Schema for getting historical records with filters
 * Sprint 5 - US-039
 *
 * Query params: from (default: 30 días atrás), to (default: hoy)
 * Validations:
 * - Formato YYYY-MM-DD
 * - from <= to
 * - Rango máximo 365 días
 */
export const getHistoricalRecordsSchema = z
  .object({
    from: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'from must be in YYYY-MM-DD format')
      .transform((val) => parseLocalDate(val))
      .optional()
      .default(() => {
        const date = new Date();
        date.setDate(date.getDate() - 30); // 30 días atrás por defecto
        date.setHours(0, 0, 0, 0);
        return date;
      }),
    to: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'to must be in YYYY-MM-DD format')
      .transform((val) => parseLocalDate(val))
      .optional()
      .default(() => {
        const date = new Date();
        date.setHours(23, 59, 59, 999); // Hoy por defecto
        return date;
      }),
    limit: z
      .string()
      .optional()
      .default('100')
      .transform((val) => parseInt(val, 10))
      .pipe(z.number().int().min(1).max(100)),
    offset: z
      .string()
      .optional()
      .default('0')
      .transform((val) => parseInt(val, 10))
      .pipe(z.number().int().min(0)),
  })
  .refine((data) => data.from <= data.to, {
    message: 'from date must be less than or equal to to date',
    path: ['from'],
  })
  .refine(
    (data) => {
      const diffTime = Math.abs(data.to.getTime() - data.from.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 365;
    },
    {
      message: 'Date range cannot exceed 365 days',
      path: ['from'],
    }
  );

/**
 * Schema for retroactive marking (Sprint 5 - US-040)
 * Similar to createHabitRecordSchema but with explicit 7-day window validation
 * and no default date (date is required for retroactive marking)
 */
export const retroactiveMarkingSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be in YYYY-MM-DD format')
    .transform((val) => parseLocalDate(val))
    .refine((date) => !isNaN(date.getTime()), {
      message: 'Invalid date format',
    })
    .refine(
      (date) => {
        // Don't allow future dates
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        return date <= today;
      },
      {
        message: 'Cannot register completions for future dates',
      }
    )
    .refine(
      (date) => {
        // Don't allow dates more than 7 days in the past (US-040)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);

        const normalizedDate = new Date(date);
        normalizedDate.setHours(0, 0, 0, 0);

        return normalizedDate >= sevenDaysAgo;
      },
      {
        message: 'Cannot register completions for dates more than 7 days in the past',
      }
    ),
  completed: z.boolean(),
  value: z.number().positive('Value must be a positive number').optional(),
  notes: z.string().max(500, 'Notes must be 500 characters or less').trim().optional(),
});

/**
 * Type inference from schemas
 */
export type CreateHabitRecordInput = z.infer<typeof createHabitRecordSchema>;
export type GetRecordsByDateRangeInput = z.infer<typeof getRecordsByDateRangeSchema>;
export type GetRecordByDateInput = z.infer<typeof getRecordByDateSchema>;
export type GetHistoricalRecordsInput = z.infer<typeof getHistoricalRecordsSchema>;
export type RetroactiveMarkingInput = z.infer<typeof retroactiveMarkingSchema>;
