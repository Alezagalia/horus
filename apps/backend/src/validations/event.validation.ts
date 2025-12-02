/**
 * Event Validation Schemas
 * Sprint 8 - US-066
 */

import { z } from 'zod';
import rrule from 'rrule';
const { RRule } = rrule;

export const eventStatusEnum = z.enum(['pendiente', 'completado', 'cancelado']);

export const createEventSchema = z
  .object({
    categoryId: z.string().uuid('Category ID must be a valid UUID'),
    title: z.string().min(1, 'Title is required').max(200).trim(),
    description: z.string().max(5000).optional(),
    location: z.string().max(200).trim().optional(),
    startDateTime: z.string().datetime('Invalid start date time'),
    endDateTime: z.string().datetime('Invalid end date time'),
    isAllDay: z.boolean().default(false),
    isRecurring: z.boolean().default(false),
    rrule: z.string().optional(),
    reminderMinutes: z.number().int().min(0).max(43200).optional(), // Max 30 días
    syncWithGoogle: z.boolean().default(true),
  })
  .refine(
    (data) => {
      const start = new Date(data.startDateTime);
      const end = new Date(data.endDateTime);
      return end > start;
    },
    {
      message: 'endDateTime must be after startDateTime',
      path: ['endDateTime'],
    }
  )
  .refine(
    (data) => {
      if (!data.isRecurring) return true;
      if (!data.rrule) return false;

      try {
        // Validate rrule format
        RRule.fromString(data.rrule);
        return true;
      } catch (error) {
        return false;
      }
    },
    {
      message: 'Valid rrule is required when isRecurring is true',
      path: ['rrule'],
    }
  );

export const updateEventSchema = z
  .object({
    title: z.string().min(1, 'Title is required').max(200).trim().optional(),
    description: z.string().max(5000).optional().nullable(),
    categoryId: z.string().uuid('Category ID must be a valid UUID').optional(),
    location: z.string().max(200).trim().optional().nullable(),
    startDateTime: z.string().datetime('Invalid start date time').optional(),
    endDateTime: z.string().datetime('Invalid end date time').optional(),
    isAllDay: z.boolean().optional(),
    reminderMinutes: z.number().int().min(0).max(43200).optional().nullable(),
    status: eventStatusEnum.optional(),
  })
  .refine(
    (data) => {
      if (!data.startDateTime || !data.endDateTime) return true;
      const start = new Date(data.startDateTime);
      const end = new Date(data.endDateTime);
      return end > start;
    },
    {
      message: 'endDateTime must be after startDateTime',
      path: ['endDateTime'],
    }
  );

export const getEventsQuerySchema = z.object({
  from: z.string().datetime('Invalid from date'),
  to: z.string().datetime('Invalid to date'),
  categoryId: z.string().uuid().optional(),
  status: eventStatusEnum.optional(),
});

export type CreateEventDTO = z.infer<typeof createEventSchema>;
export type UpdateEventDTO = z.infer<typeof updateEventSchema>;
export type GetEventsQueryDTO = z.infer<typeof getEventsQuerySchema>;
