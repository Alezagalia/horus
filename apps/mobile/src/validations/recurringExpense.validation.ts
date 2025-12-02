/**
 * Recurring Expense Validation Schema
 * Sprint 10 - US-089
 *
 * Zod schemas for recurring expense form validation
 */

import { z } from 'zod';

/**
 * Schema for creating/editing recurring expense
 */
export const recurringExpenseSchema = z.object({
  concept: z
    .string()
    .min(1, 'El concepto es requerido')
    .max(100, 'El concepto no puede exceder 100 caracteres')
    .trim(),
  categoryId: z.string().uuid('Debe seleccionar una categoría válida'),
  currency: z.enum(['ARS', 'USD', 'EUR', 'BRL'], {
    errorMap: () => ({ message: 'Debe seleccionar una moneda válida' }),
  }),
});

export type RecurringExpenseFormData = z.infer<typeof recurringExpenseSchema>;
