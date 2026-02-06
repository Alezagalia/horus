/**
 * Account Validation Schemas
 * Sprint 9 - US-074
 */

import { z } from 'zod';

// Enum para tipos de cuenta
export const accountTypeEnum = z.enum(['efectivo', 'banco', 'billetera_digital', 'tarjeta']);

// Lista de códigos de moneda ISO 4217 más comunes
const validCurrencyCodes = [
  'ARS',
  'USD',
  'EUR',
  'BRL',
  'CLP',
  'COP',
  'MXN',
  'UYU',
  'PEN', // América Latina
  'GBP',
  'JPY',
  'CNY',
  'CHF',
  'CAD',
  'AUD',
  'NZD',
  'INR',
  'RUB', // Otros
] as const;

export const currencyCodeEnum = z.enum(validCurrencyCodes);

// Colores hexadecimales predefinidos por tipo de cuenta
export const accountColors = {
  efectivo: '#10B981', // Green
  banco: '#3B82F6', // Blue
  billetera_digital: '#8B5CF6', // Purple
  tarjeta: '#F59E0B', // Orange
};

// Iconos predefinidos por tipo de cuenta
export const accountIcons = {
  efectivo: '💵',
  banco: '🏦',
  billetera_digital: '📱',
  tarjeta: '💳',
};

/**
 * Schema para crear una cuenta
 */
export const createAccountSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .trim(),
  type: accountTypeEnum,
  currency: currencyCodeEnum,
  initialBalance: z
    .number()
    .or(z.string().transform((val) => parseFloat(val)))
    .refine((val) => !isNaN(val), { message: 'El balance inicial debe ser un número válido' })
    .refine((val) => val >= 0, { message: 'El balance inicial no puede ser negativo' }),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'El color debe ser un código hexadecimal válido (#RRGGBB)')
    .optional(),
  icon: z.string().max(10, 'El ícono no puede exceder 10 caracteres').optional(),
});

/**
 * Schema para actualizar una cuenta
 */
export const updateAccountSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .trim()
    .optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'El color debe ser un código hexadecimal válido (#RRGGBB)')
    .optional(),
  icon: z.string().max(10, 'El ícono no puede exceder 10 caracteres').optional(),
  initialBalance: z
    .number()
    .or(z.string().transform((val) => parseFloat(val)))
    .refine((val) => !isNaN(val), { message: 'El balance inicial debe ser un número válido' })
    .refine((val) => val >= 0, { message: 'El balance inicial no puede ser negativo' })
    .optional(),
  currency: currencyCodeEnum.optional(),
  // No permitimos actualizar: type (integridad)
});

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
