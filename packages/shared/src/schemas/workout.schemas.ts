/**
 * Workout Zod Schemas
 * Sprint 14 - US-128, US-129, US-130
 */

import { z } from 'zod';

export const startWorkoutSchema = z.object({
  routineId: z.string().cuid(),
});

export const addSetSchema = z.object({
  reps: z.number().int().positive('Las repeticiones deben ser mayor a 0'),
  weight: z.number().nonnegative('El peso no puede ser negativo'),
  weightUnit: z.enum(['kg', 'lb']).default('kg'),
  completed: z.boolean().default(true),
  restTime: z.number().int().positive().nullable().optional(),
  notes: z.string().max(500, 'Las notas no pueden exceder 500 caracteres').nullable().optional(),
});

export const updateSetSchema = z.object({
  reps: z.number().int().positive('Las repeticiones deben ser mayor a 0').optional(),
  weight: z.number().nonnegative('El peso no puede ser negativo').optional(),
  weightUnit: z.enum(['kg', 'lb']).optional(),
  completed: z.boolean().optional(),
  restTime: z.number().int().positive().nullable().optional(),
  notes: z.string().max(500, 'Las notas no pueden exceder 500 caracteres').nullable().optional(),
});

export const updateWorkoutExerciseSchema = z.object({
  rpe: z.number().int().min(1, 'RPE mínimo es 1').max(10, 'RPE máximo es 10').nullable().optional(),
  notes: z.string().max(500, 'Las notas no pueden exceder 500 caracteres').nullable().optional(),
});

export const finishWorkoutSchema = z.object({
  notes: z.string().max(1000, 'Las notas no pueden exceder 1000 caracteres').nullable().optional(),
});

export const listWorkoutsQuerySchema = z.object({
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  routineId: z.string().cuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type StartWorkoutInput = z.infer<typeof startWorkoutSchema>;
export type AddSetInput = z.infer<typeof addSetSchema>;
export type UpdateSetInput = z.infer<typeof updateSetSchema>;
export type UpdateWorkoutExerciseInput = z.infer<typeof updateWorkoutExerciseSchema>;
export type FinishWorkoutInput = z.infer<typeof finishWorkoutSchema>;
export type ListWorkoutsQuery = z.infer<typeof listWorkoutsQuerySchema>;
