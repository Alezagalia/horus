/**
 * Budget Validation Schemas
 * F-01 - Presupuestos Mensuales por Categoría
 */

import { z } from 'zod';

export const createBudgetSchema = z.object({
  categoryId: z.string().uuid('El ID de categoría debe ser un UUID válido'),
  amount: z.number().positive('El monto debe ser mayor a 0'),
  currency: z
    .string()
    .length(3, 'La moneda debe tener exactamente 3 caracteres')
    .toUpperCase()
    .regex(/^[A-Z]{3}$/, 'La moneda debe contener solo letras mayúsculas'),
});

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;

export const updateBudgetSchema = z.object({
  amount: z.number().positive('El monto debe ser mayor a 0').optional(),
  currency: z
    .string()
    .length(3, 'La moneda debe tener exactamente 3 caracteres')
    .toUpperCase()
    .regex(/^[A-Z]{3}$/, 'La moneda debe contener solo letras mayúsculas')
    .optional(),
});

export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;

export const getBudgetsSummarySchema = z.object({
  month: z.coerce
    .number()
    .int()
    .min(1, 'El mes debe ser entre 1 y 12')
    .max(12, 'El mes debe ser entre 1 y 12'),
  year: z.coerce
    .number()
    .int()
    .min(2000, 'El año debe ser entre 2000 y 2100')
    .max(2100, 'El año debe ser entre 2000 y 2100'),
});

export type GetBudgetsSummaryQuery = z.infer<typeof getBudgetsSummarySchema>;
