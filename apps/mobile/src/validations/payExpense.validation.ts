/**
 * Pay Expense Validation Schema
 * Sprint 10 - US-091
 *
 * Zod schemas for pay expense form validation
 */

import { z } from 'zod';

/**
 * Schema for paying a monthly expense
 */
export const payExpenseSchema = z.object({
  amount: z
    .number({
      required_error: 'El monto es requerido',
      invalid_type_error: 'El monto debe ser un número',
    })
    .positive('El monto debe ser mayor a 0')
    .finite('El monto debe ser un número válido'),
  accountId: z.string().uuid('Debe seleccionar una cuenta válida'),
  paidDate: z.date({
    required_error: 'La fecha es requerida',
    invalid_type_error: 'Debe ser una fecha válida',
  }),
  notes: z.string().max(500, 'Las notas no pueden exceder 500 caracteres').optional(),
});

export type PayExpenseFormData = z.infer<typeof payExpenseSchema>;
