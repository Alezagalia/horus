/**
 * Monthly Expense Validation Schemas
 * Sprint 10 - US-085
 *
 * Zod schemas for validating monthly expense instance queries
 */

import { z } from 'zod';
import { ExpenseStatus } from '../generated/prisma/client.js';

/**
 * Schema for validating month/year path parameters
 */
export const monthYearParamsSchema = z.object({
  month: z
    .string()
    .regex(/^([1-9]|1[0-2])$/, 'El mes debe estar entre 1 y 12')
    .transform((val) => parseInt(val, 10)),
  year: z
    .string()
    .regex(/^\d{4}$/, 'El año debe tener 4 dígitos')
    .transform((val) => parseInt(val, 10))
    .refine((year) => year >= 2000 && year <= 2100, {
      message: 'El año debe estar entre 2000 y 2100',
    }),
});

export type MonthYearParams = z.infer<typeof monthYearParamsSchema>;

/**
 * Schema for GET /monthly-expenses query parameters
 */
export const getMonthlyExpensesQuerySchema = z.object({
  status: z.enum([ExpenseStatus.pendiente, ExpenseStatus.pagado]).optional(),
});

export type GetMonthlyExpensesQuery = z.infer<typeof getMonthlyExpensesQuerySchema>;

/**
 * Schema for marking a monthly expense as paid
 */
export const payMonthlyExpenseSchema = z.object({
  amount: z
    .number()
    .positive('El monto debe ser mayor a 0')
    .finite('El monto debe ser un número finito'),
  accountId: z.string().uuid('El ID de cuenta debe ser un UUID válido'),
  paidDate: z
    .string()
    .datetime('La fecha debe ser un formato ISO 8601 válido')
    .optional()
    .or(z.date())
    .transform((val) => (val ? new Date(val) : undefined)),
  notes: z.string().max(500, 'Las notas no pueden exceder 500 caracteres').optional(),
});

export type PayMonthlyExpenseInput = z.infer<typeof payMonthlyExpenseSchema>;

/**
 * Schema for updating a paid monthly expense
 */
export const updateMonthlyExpenseSchema = z.object({
  amount: z
    .number()
    .positive('El monto debe ser mayor a 0')
    .finite('El monto debe ser un número finito')
    .optional(),
  accountId: z.string().uuid('El ID de cuenta debe ser un UUID válido').optional(),
  paidDate: z
    .string()
    .datetime('La fecha debe ser un formato ISO 8601 válido')
    .optional()
    .or(z.date())
    .transform((val) => (val ? new Date(val) : undefined)),
  notes: z.string().max(500, 'Las notas no pueden exceder 500 caracteres').optional(),
});

export type UpdateMonthlyExpenseInput = z.infer<typeof updateMonthlyExpenseSchema>;
