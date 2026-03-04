/**
 * Exercise Zod Schemas
 * Sprint 14 - US-126
 */

import { z } from 'zod';

export const muscleGroups = [
  'pecho',
  'espalda',
  'piernas',
  'hombros',
  'brazos',
  'core',
  'cardio',
  'otro',
] as const;

export const createExerciseSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  muscleGroup: z.enum(muscleGroups).nullable().optional(),
  notes: z.string().max(500, 'Las notas no pueden exceder 500 caracteres').nullable().optional(),
});

export const updateExerciseSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .optional(),
  muscleGroup: z.enum(muscleGroups).nullable().optional(),
  notes: z.string().max(500, 'Las notas no pueden exceder 500 caracteres').nullable().optional(),
});

export const exerciseFiltersSchema = z.object({
  muscleGroup: z.enum(muscleGroups).optional(),
  search: z.string().optional(),
});

export type CreateExerciseInput = z.infer<typeof createExerciseSchema>;
export type UpdateExerciseInput = z.infer<typeof updateExerciseSchema>;
export type ExerciseFiltersInput = z.infer<typeof exerciseFiltersSchema>;
