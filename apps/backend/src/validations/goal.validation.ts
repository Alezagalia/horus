/**
 * Goal Validation Schemas
 * F-02 - Metas y Objetivos (Goals + OKRs)
 */

import { z } from 'zod';

export const createGoalSchema = z.object({
  title: z.string().min(1, 'El título es requerido').max(200, 'Máximo 200 caracteres'),
  description: z.string().optional(),
  categoryId: z.string().uuid('El ID de categoría debe ser un UUID válido').optional(),
  priority: z.enum(['alta', 'media', 'baja']).optional(),
  targetDate: z.string().optional(),
});

export type CreateGoalInput = z.infer<typeof createGoalSchema>;

export const updateGoalSchema = z.object({
  title: z.string().min(1, 'El título es requerido').max(200, 'Máximo 200 caracteres').optional(),
  description: z.string().optional(),
  categoryId: z.string().uuid('El ID de categoría debe ser un UUID válido').optional(),
  priority: z.enum(['alta', 'media', 'baja']).optional(),
  targetDate: z.string().optional(),
  status: z.enum(['en_progreso', 'completada', 'cancelada']).optional(),
});

export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;

export const createKeyResultSchema = z.object({
  title: z.string().min(1, 'El título es requerido').max(200, 'Máximo 200 caracteres'),
  targetValue: z.number().positive('El valor objetivo debe ser mayor a 0'),
  currentValue: z.number().min(0, 'El valor actual no puede ser negativo').optional().default(0),
  unit: z.string().max(50, 'Máximo 50 caracteres').optional(),
});

export type CreateKeyResultInput = z.infer<typeof createKeyResultSchema>;

export const updateKeyResultSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  targetValue: z.number().positive().optional(),
  currentValue: z.number().min(0).optional(),
  unit: z.string().max(50).optional(),
});

export type UpdateKeyResultInput = z.infer<typeof updateKeyResultSchema>;
