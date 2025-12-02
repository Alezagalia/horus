/**
 * Category Validation Schemas - Shared across Backend, Mobile, and Web
 * Sprint 2 - US-020
 */

import { z } from 'zod';

/**
 * Scope enum schema for Zod validation
 */
export const scopeSchema = z.enum(['habitos', 'tareas', 'eventos', 'gastos']);

/**
 * Create Category Schema
 * Used for validating category creation requests
 */
export const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(50).trim(),
  scope: scopeSchema,
  icon: z.string().max(10).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color (e.g., #FF5733)')
    .optional(),
});

/**
 * Update Category Schema
 * Used for validating category update requests
 */
export const updateCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(50).trim().optional(),
  icon: z.string().max(10).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color (e.g., #FF5733)')
    .optional(),
});

/**
 * Get Categories Query Schema
 * Used for validating query parameters
 */
export const getCategoriesQuerySchema = z.object({
  scope: scopeSchema.optional(),
});

/**
 * Type inference from schemas
 */
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type GetCategoriesQuery = z.infer<typeof getCategoriesQuerySchema>;
