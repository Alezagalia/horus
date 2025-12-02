/**
 * Task Form Validation Schemas
 * Sprint 7 - US-062
 *
 * Zod schemas para validación de formularios de tareas
 */

import { z } from 'zod';

// Schema para crear tarea
export const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, 'El título es requerido')
    .max(200, 'El título no puede exceder 200 caracteres')
    .trim(),
  description: z.string().optional(),
  categoryId: z.string().uuid('Debes seleccionar una categoría'),
  priority: z.enum(['alta', 'media', 'baja'], {
    required_error: 'Debes seleccionar una prioridad',
  }),
  dueDate: z
    .string()
    .optional()
    .refine(
      (date) => {
        if (!date) return true;
        const dueDateTime = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return dueDateTime >= today;
      },
      {
        message: 'La fecha de vencimiento debe ser hoy o posterior',
      }
    ),
});

// Schema para editar tarea
export const editTaskSchema = createTaskSchema
  .extend({
    status: z.enum(['pendiente', 'en_progreso', 'completada', 'cancelada'], {
      required_error: 'Debes seleccionar un estado',
    }),
    cancelReason: z.string().max(200, 'La razón no puede exceder 200 caracteres').optional(),
  })
  .refine(
    (data) => {
      // Si el status es 'cancelada', debe haber una razón
      if (data.status === 'cancelada' && !data.cancelReason) {
        return false;
      }
      return true;
    },
    {
      message: 'Debes proporcionar una razón de cancelación',
      path: ['cancelReason'],
    }
  );

// Tipos inferidos de los schemas
export type CreateTaskFormData = z.infer<typeof createTaskSchema>;
export type EditTaskFormData = z.infer<typeof editTaskSchema>;
