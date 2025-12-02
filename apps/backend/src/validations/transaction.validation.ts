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
 */
export const getTransactionsQuerySchema = z.object({
  accountId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  type: transactionTypeEnum.optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
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

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type GetTransactionsQuery = z.infer<typeof getTransactionsQuerySchema>;
export type CreateTransferInput = z.infer<typeof createTransferSchema>;
export type UpdateTransferInput = z.infer<typeof updateTransferSchema>;
