/**
 * Habit Form Validation Schema
 * Sprint 11 - US-099
 */

import { z } from 'zod';

export const habitSchema = z
  .object({
    name: z
      .string()
      .min(1, 'El nombre es obligatorio')
      .min(3, 'El nombre debe tener al menos 3 caracteres')
      .max(100, 'El nombre no puede exceder 100 caracteres'),
    description: z.string().max(500, 'La descripción no puede exceder 500 caracteres').optional().default(''),
    categoryId: z.string().min(1, 'La categoría es obligatoria'),
    type: z.enum(['CHECK', 'NUMERIC'], {
      required_error: 'El tipo es obligatorio',
    }),
    targetValue: z
      .number()
      .positive('El valor objetivo debe ser positivo')
      .nullable()
      .optional()
      .transform((val) => val ?? undefined),
    unit: z.string().max(50, 'La unidad no puede exceder 50 caracteres').optional().default(''),
    periodicity: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM'], {
      required_error: 'La periodicidad es obligatoria',
    }),
    weekDays: z.array(z.number().min(0).max(6)).optional().default([]),
    timeOfDay: z.enum(['AYUNO', 'MANANA', 'MEDIA_MANANA', 'TARDE', 'MEDIA_TARDE', 'NOCHE', 'ANTES_DORMIR', 'ANYTIME'], {
      required_error: 'El momento del día es obligatorio',
    }),
    color: z
      .string()
      .nullable()
      .optional()
      .transform((val) => (val && /^#[0-9A-Fa-f]{6}$/.test(val) ? val : undefined)),
  })
  .superRefine((data, ctx) => {
    // If type is NUMERIC, targetValue is required
    if (data.type === 'NUMERIC') {
      if (data.targetValue === undefined || data.targetValue === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'El valor objetivo es obligatorio para hábitos numéricos',
          path: ['targetValue'],
        });
      }
      if (!data.unit || data.unit.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'La unidad es obligatoria para hábitos numéricos',
          path: ['unit'],
        });
      }
    }
    // If periodicity is WEEKLY, weekDays must have at least one day
    if (data.periodicity === 'WEEKLY') {
      if (!data.weekDays || data.weekDays.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Debes seleccionar al menos un día de la semana',
          path: ['weekDays'],
        });
      }
    }
  });

export type HabitFormSchema = z.infer<typeof habitSchema>;
