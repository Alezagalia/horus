/**
 * Savings Goal Validation Schemas
 * Metas de Ahorro vinculadas a Cuentas
 */

import { z } from 'zod';

export const createSavingsGoalSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(200, 'El nombre es demasiado largo'),
  accountId: z.string().uuid('El ID de cuenta debe ser un UUID válido'),
  targetAmount: z.number().positive('El monto objetivo debe ser mayor a 0'),
  targetDate: z.string().datetime({ offset: true }).optional().nullable(),
  notes: z.string().max(2000, 'Las notas son demasiado largas').optional().nullable(),
});

export type CreateSavingsGoalInput = z.infer<typeof createSavingsGoalSchema>;

export const updateSavingsGoalSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  targetAmount: z.number().positive('El monto objetivo debe ser mayor a 0').optional(),
  targetDate: z.string().datetime({ offset: true }).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  status: z.enum(['en_progreso', 'completada', 'cancelada']).optional(),
});

export type UpdateSavingsGoalInput = z.infer<typeof updateSavingsGoalSchema>;
