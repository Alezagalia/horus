/**
 * Event Validation Schemas
 * Sprint 8 - US-071
 *
 * Zod schemas for event creation and editing
 */

import { z } from 'zod';

export const createEventSchema = z
  .object({
    title: z
      .string()
      .min(1, 'El título es requerido')
      .max(200, 'El título no puede exceder 200 caracteres'),
    description: z.string().optional(),
    categoryId: z.string().min(1, 'La categoría es requerida'),
    location: z.string().max(200, 'La ubicación no puede exceder 200 caracteres').optional(),
    startDateTime: z.date(),
    endDateTime: z.date(),
    isAllDay: z.boolean().default(false),
    isRecurring: z.boolean().default(false),
    rrule: z.string().optional(),
    reminderMinutes: z.number().optional(),
    syncWithGoogle: z.boolean().default(false),
  })
  .refine((data) => data.endDateTime >= data.startDateTime, {
    message: 'La fecha de fin debe ser posterior a la de inicio',
    path: ['endDateTime'],
  });

export const editEventSchema = createEventSchema.extend({
  status: z.enum(['pendiente', 'completado', 'cancelado']).optional(),
});

export type CreateEventFormData = z.infer<typeof createEventSchema>;
export type EditEventFormData = z.infer<typeof editEventSchema>;
