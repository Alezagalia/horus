/**
 * Task Form Validation Schema
 * Sprint 11 - US-101
 */

import { z } from 'zod';

export const taskSchema = z.object({
  title: z
    .string()
    .min(1, 'El título es obligatorio')
    .min(3, 'El título debe tener al menos 3 caracteres')
    .max(200, 'El título no puede exceder 200 caracteres'),
  description: z.string().max(1000, 'La descripción no puede exceder 1000 caracteres').optional(),
  priority: z.enum(['alta', 'media', 'baja'], {
    required_error: 'La prioridad es obligatoria',
  }),
  dueDate: z.string().optional(),
  categoryId: z.string().min(1, 'La categoría es obligatoria'),
  checklist: z.array(
    z.object({
      text: z.string(), // Permitir vacíos, se filtrarán en el submit
      completed: z.boolean(),
    })
  ).optional().default([]),
});

export type TaskFormSchema = z.infer<typeof taskSchema>;
