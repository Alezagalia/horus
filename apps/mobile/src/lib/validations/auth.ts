/**
 * Auth Validation Schemas
 * Sprint 1 - Authentication System
 */

import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Ingresa un email válido')
    .toLowerCase()
    .trim(),
  password: z.string().min(1, 'La contraseña es requerida').min(6, 'Mínimo 6 caracteres'),
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(1, 'El nombre es requerido')
      .min(2, 'Mínimo 2 caracteres')
      .max(100, 'Máximo 100 caracteres')
      .trim(),
    email: z
      .string()
      .min(1, 'El email es requerido')
      .email('Ingresa un email válido')
      .toLowerCase()
      .trim(),
    password: z
      .string()
      .min(1, 'La contraseña es requerida')
      .min(6, 'Mínimo 6 caracteres')
      .max(100, 'Máximo 100 caracteres'),
    confirmPassword: z.string().min(1, 'Confirma tu contraseña'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
