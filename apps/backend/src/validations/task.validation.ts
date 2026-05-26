/**
 * Task Validation Schemas
 * Sprint 7 - US-057
 */

import { z } from 'zod';

export const priorityEnum = z.enum(['alta', 'media', 'baja']);
export const taskStatusEnum = z.enum(['pendiente', 'en_progreso', 'completada', 'cancelada']);
export const dueDateFilterEnum = z.enum(['overdue', 'today', 'week', 'month', 'none']);

export const createTaskSchema = z.object({
  categoryId: z.string().uuid('Category ID must be a valid UUID').optional(),
  title: z.string().min(1, 'Title is required').max(200).trim(),
  description: z.string().max(5000).optional().nullable(),
  priority: priorityEnum.default('media'),
  dueDate: z
    .string()
    .datetime()
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
        message: 'dueDate must be today or in the future',
      }
    ),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200).trim().optional(),
  description: z.string().max(5000).optional().nullable(),
  categoryId: z.string().uuid('Category ID must be a valid UUID').optional(),
  priority: priorityEnum.optional(),
  status: taskStatusEnum.optional(),
  dueDate: z
    .string()
    .datetime()
    .optional()
    .nullable()
    .refine(
      (date) => {
        if (!date) return true;
        const dueDateTime = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return dueDateTime >= today;
      },
      {
        message: 'dueDate must be today or in the future',
      }
    ),
  cancelReason: z.string().max(200).optional().nullable(),
});

export const getTasksQuerySchema = z.object({
  status: taskStatusEnum.optional(),
  priority: priorityEnum.optional(),
  categoryId: z.string().uuid().optional(),
  dueDateFilter: dueDateFilterEnum.optional(),
});
