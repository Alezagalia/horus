/**
 * Nutrition Zod Schemas - F-17
 */

import { z } from 'zod';

export const mealTimes = [
  'BREAKFAST',
  'MORNING_SNACK',
  'LUNCH',
  'AFTERNOON_SNACK',
  'DINNER',
] as const;

// ─── Food schemas ─────────────────────────────────────────────────────────────

export const createFoodSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(150, 'Máximo 150 caracteres'),
  brand: z.string().max(100).nullable().optional(),
  calories: z.number().min(0, 'Las calorías no pueden ser negativas'),
  protein: z.number().min(0),
  carbs: z.number().min(0),
  fat: z.number().min(0),
  fiber: z.number().min(0).nullable().optional(),
  unit: z.string().max(20).optional().default('g'),
});

export const updateFoodSchema = z.object({
  name: z.string().min(1).max(150).optional(),
  brand: z.string().max(100).nullable().optional(),
  calories: z.number().min(0).optional(),
  protein: z.number().min(0).optional(),
  carbs: z.number().min(0).optional(),
  fat: z.number().min(0).optional(),
  fiber: z.number().min(0).nullable().optional(),
  unit: z.string().max(20).optional(),
  isActive: z.boolean().optional(),
});

export const foodFiltersSchema = z.object({
  search: z.string().optional(),
  isActive: z
    .string()
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
});

// ─── Recipe schemas ───────────────────────────────────────────────────────────

export const recipeIngredientSchema = z.object({
  foodId: z.string().uuid(),
  grams: z.number().positive('Los gramos deben ser positivos'),
  notes: z.string().max(200).nullable().optional(),
});

export const createRecipeSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(150, 'Máximo 150 caracteres'),
  description: z.string().nullable().optional(),
  servings: z.number().int().min(1).optional().default(1),
  ingredients: z.array(recipeIngredientSchema).optional().default([]),
});

export const updateRecipeSchema = z.object({
  name: z.string().min(1).max(150).optional(),
  description: z.string().nullable().optional(),
  servings: z.number().int().min(1).optional(),
  isActive: z.boolean().optional(),
});

export const addIngredientSchema = recipeIngredientSchema;

// ─── MealPlan schemas ─────────────────────────────────────────────────────────

export const createMealPlanSchema = z.object({
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
  notes: z.string().nullable().optional(),
});

export const addMealEntryItemSchema = z.object({
  foodId: z.string().uuid().nullable().optional(),
  recipeId: z.string().uuid().nullable().optional(),
  grams: z.number().positive(),
  servings: z.number().positive().nullable().optional(),
});

export const addMealEntrySchema = z
  .object({
    day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
    mealTime: z.enum(mealTimes),
    notes: z.string().max(300).nullable().optional(),
    items: z.array(addMealEntryItemSchema).min(1, 'Debe haber al menos un ítem'),
  })
  .refine((data) => data.items.every((item) => item.foodId != null || item.recipeId != null), {
    message: 'Cada ítem debe tener foodId o recipeId',
  });

// ─── NutritionLog schemas ─────────────────────────────────────────────────────

export const addNutritionLogItemSchema = z.object({
  foodId: z.string().uuid().nullable().optional(),
  mealTime: z.enum(mealTimes),
  grams: z.number().positive(),
  servings: z.number().positive().nullable().optional(),
  notes: z.string().max(200).nullable().optional(),
});

export const upsertNutritionLogSchema = z.object({
  notes: z.string().nullable().optional(),
  items: z.array(addNutritionLogItemSchema).optional(),
});

// ─── ShoppingList schemas ─────────────────────────────────────────────────────

export const createShoppingListItemSchema = z.object({
  foodId: z.string().uuid().nullable().optional(),
  name: z.string().min(1).max(150),
  quantity: z.number().positive(),
  unit: z.string().min(1).max(20),
  notes: z.string().max(200).nullable().optional(),
});

export const createShoppingListSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(150, 'Máximo 150 caracteres'),
  mealPlanId: z.string().uuid().nullable().optional(),
  items: z.array(createShoppingListItemSchema).optional().default([]),
});

export const linkTransactionSchema = z.object({
  transactionId: z.string().uuid(),
});

export const checkItemSchema = z.object({
  checked: z.boolean(),
});

// ─── Inferred types ───────────────────────────────────────────────────────────

export type CreateFoodInput = z.infer<typeof createFoodSchema>;
export type UpdateFoodInput = z.infer<typeof updateFoodSchema>;
export type FoodFiltersInput = z.infer<typeof foodFiltersSchema>;
export type CreateRecipeInput = z.infer<typeof createRecipeSchema>;
export type UpdateRecipeInput = z.infer<typeof updateRecipeSchema>;
export type CreateMealPlanInput = z.infer<typeof createMealPlanSchema>;
export type AddMealEntryInput = z.infer<typeof addMealEntrySchema>;
export type UpsertNutritionLogInput = z.infer<typeof upsertNutritionLogSchema>;
export type CreateShoppingListInput = z.infer<typeof createShoppingListSchema>;
export type LinkTransactionInput = z.infer<typeof linkTransactionSchema>;
export type CheckItemInput = z.infer<typeof checkItemSchema>;
