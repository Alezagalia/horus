/**
 * Recurring Expense Validation Schemas
 * Sprint 10 - US-084
 *
 * Zod schemas for validating recurring expense templates
 */

import { z } from 'zod';

/**
 * Schema for creating a recurring expense template
 */
export const createRecurringExpenseSchema = z.object({
  concept: z
    .string()
    .min(1, 'El concepto es requerido')
    .max(200, 'El concepto no puede exceder 200 caracteres')
    .trim(),
  categoryId: z.string().uuid('El ID de categoría debe ser un UUID válido'),
  currency: z
    .string()
    .length(3, 'La moneda debe tener exactamente 3 caracteres')
    .toUpperCase()
    .regex(/^[A-Z]{3}$/, 'La moneda debe contener solo letras mayúsculas'),
});

export type CreateRecurringExpenseInput = z.infer<typeof createRecurringExpenseSchema>;

/**
 * Schema for updating a recurring expense template
 */
export const updateRecurringExpenseSchema = z.object({
  concept: z
    .string()
    .min(1, 'El concepto es requerido')
    .max(200, 'El concepto no puede exceder 200 caracteres')
    .trim()
    .optional(),
  categoryId: z.string().uuid('El ID de categoría debe ser un UUID válido').optional(),
  currency: z
    .string()
    .length(3, 'La moneda debe tener exactamente 3 caracteres')
    .toUpperCase()
    .regex(/^[A-Z]{3}$/, 'La moneda debe contener solo letras mayúsculas')
    .optional(),
});

export type UpdateRecurringExpenseInput = z.infer<typeof updateRecurringExpenseSchema>;

/**
 * Schema for GET /recurring-expenses query parameters
 */
export const getRecurringExpensesQuerySchema = z.object({
  activeOnly: z
    .string()
    .optional()
    .transform((val) => val === 'true')
    .pipe(z.boolean()),
});

export type GetRecurringExpensesQuery = z.infer<typeof getRecurringExpensesQuerySchema>;
