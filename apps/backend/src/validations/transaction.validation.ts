/**
 * Transaction Validation Schemas
 * Sprint 9 - US-075
 */

import { z } from 'zod';

// Enum para tipos de transacción
export const transactionTypeEnum = z.enum(['ingreso', 'egreso']);

/**
 * Schema para crear una transacción
 */
export const createTransactionSchema = z.object({
  accountId: z.string().uuid('Account ID must be a valid UUID'),
  categoryId: z.string().uuid('Category ID must be a valid UUID'),
  type: transactionTypeEnum,
  amount: z
    .number()
    .or(z.string().transform((val) => parseFloat(val)))
    .refine((val) => !isNaN(val), { message: 'El monto debe ser un número válido' })
    .refine((val) => val > 0, { message: 'El monto debe ser mayor a 0' }),
  concept: z
    .string()
    .min(1, 'El concepto es requerido')
    .max(200, 'El concepto no puede exceder 200 caracteres')
    .trim(),
  date: z
    .string()
    .datetime()
    .refine(
      (dateStr) => {
        const date = new Date(dateStr);
        const oneYearFromNow = new Date();
        oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
        return date <= oneYearFromNow;
      },
      {
        message: 'La fecha no puede ser más de 1 año en el futuro',
      }
    ),
  notes: z.string().max(1000, 'Las notas no pueden exceder 1000 caracteres').optional(),
});

/**
 * Schema para actualizar una transacción
 */
export const updateTransactionSchema = z.object({
  amount: z
    .number()
    .or(z.string().transform((val) => parseFloat(val)))
    .refine((val) => !isNaN(val), { message: 'El monto debe ser un número válido' })
    .refine((val) => val > 0, { message: 'El monto debe ser mayor a 0' })
    .optional(),
  concept: z
    .string()
    .min(1, 'El concepto es requerido')
    .max(200, 'El concepto no puede exceder 200 caracteres')
    .trim()
    .optional(),
  date: z
    .string()
    .datetime()
    .refine(
      (dateStr) => {
        const date = new Date(dateStr);
        const oneYearFromNow = new Date();
        oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
        return date <= oneYearFromNow;
      },
      {
        message: 'La fecha no puede ser más de 1 año en el futuro',
      }
    )
    .optional(),
  notes: z.string().max(1000, 'Las notas no pueden exceder 1000 caracteres').optional().nullable(),
  categoryId: z.string().uuid('Category ID must be a valid UUID').optional(),
  // NO permitimos actualizar: type, accountId (integridad)
});

/**
 * Schema para query params de listado
 * Acepta fechas en formato YYYY-MM-DD o ISO 8601 completo
 */
export const getTransactionsQuerySchema = z.object({
  accountId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  type: transactionTypeEnum.optional(),
  from: z
    .string()
    .optional()
    .refine(
      (val) => !val || !isNaN(Date.parse(val)),
      { message: 'from must be a valid date (YYYY-MM-DD or ISO 8601)' }
    ),
  to: z
    .string()
    .optional()
    .refine(
      (val) => !val || !isNaN(Date.parse(val)),
      { message: 'to must be a valid date (YYYY-MM-DD or ISO 8601)' }
    ),
  limit: z
    .string()
    .optional()
    .default('50')
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0 && val <= 100, {
      message: 'Limit must be between 1 and 100',
    }),
  offset: z
    .string()
    .optional()
    .default('0')
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val >= 0, {
      message: 'Offset must be >= 0',
    }),
});

/**
 * Schema para transferencia entre cuentas
 */
export const createTransferSchema = z.object({
  fromAccountId: z.string().uuid('From Account ID must be a valid UUID'),
  toAccountId: z.string().uuid('To Account ID must be a valid UUID'),
  amount: z
    .number()
    .or(z.string().transform((val) => parseFloat(val)))
    .refine((val) => !isNaN(val), { message: 'El monto debe ser un número válido' })
    .refine((val) => val > 0, { message: 'El monto debe ser mayor a 0' }),
  concept: z
    .string()
    .min(1, 'El concepto es requerido')
    .max(200, 'El concepto no puede exceder 200 caracteres')
    .trim(),
  date: z
    .string()
    .datetime()
    .refine(
      (dateStr) => {
        const date = new Date(dateStr);
        const oneYearFromNow = new Date();
        oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
        return date <= oneYearFromNow;
      },
      {
        message: 'La fecha no puede ser más de 1 año en el futuro',
      }
    ),
  notes: z.string().max(1000, 'Las notas no pueden exceder 1000 caracteres').optional(),
});

/**
 * Schema para actualizar transferencia
 */
export const updateTransferSchema = z.object({
  amount: z
    .number()
    .or(z.string().transform((val) => parseFloat(val)))
    .refine((val) => !isNaN(val), { message: 'El monto debe ser un número válido' })
    .refine((val) => val > 0, { message: 'El monto debe ser mayor a 0' })
    .optional(),
  concept: z
    .string()
    .min(1, 'El concepto es requerido')
    .max(200, 'El concepto no puede exceder 200 caracteres')
    .trim()
    .optional(),
  date: z
    .string()
    .datetime()
    .refine(
      (dateStr) => {
        const date = new Date(dateStr);
        const oneYearFromNow = new Date();
        oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
        return date <= oneYearFromNow;
      },
      {
        message: 'La fecha no puede ser más de 1 año en el futuro',
      }
    )
    .optional(),
  notes: z.string().max(1000, 'Las notas no pueden exceder 1000 caracteres').optional().nullable(),
});

/**
 * Schema for expenses by category query params
 */
export const getExpensesByCategoryQuerySchema = z.object({
  month: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val >= 1 && val <= 12, {
      message: 'Month must be between 1 and 12',
    }),
  year: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val >= 2000 && val <= 2100, {
      message: 'Year must be between 2000 and 2100',
    }),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type GetTransactionsQuery = z.infer<typeof getTransactionsQuerySchema>;
export type CreateTransferInput = z.infer<typeof createTransferSchema>;
export type UpdateTransferInput = z.infer<typeof updateTransferSchema>;
export type GetExpensesByCategoryQuery = z.infer<typeof getExpensesByCategoryQuerySchema>;
