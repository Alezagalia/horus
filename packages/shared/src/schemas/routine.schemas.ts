/**
 * Routine Zod Schemas
 * Sprint 14 - US-127
 */

import { z } from 'zod';

export const routineExerciseSchema = z.object({
  exerciseId: z.string().cuid(),
  order: z.number().int().positive(),
  targetSets: z.number().int().positive().nullable().optional(),
  targetReps: z.number().int().positive().nullable().optional(),
  targetWeight: z.number().positive().nullable().optional(),
  restTime: z.number().int().positive().nullable().optional(),
  notes: z.string().max(500, 'Las notas no pueden exceder 500 caracteres').nullable().optional(),
});

export const createRoutineSchema = z
  .object({
    name: z
      .string()
      .min(1, 'El nombre es requerido')
      .max(100, 'El nombre no puede exceder 100 caracteres'),
    description: z
      .string()
      .max(500, 'La descripción no puede exceder 500 caracteres')
      .nullable()
      .optional(),
    exercises: z.array(routineExerciseSchema).min(1, 'La rutina debe tener al menos 1 ejercicio'),
  })
  .refine(
    (data) => {
      const orders = data.exercises.map((e) => e.order);
      const uniqueOrders = new Set(orders);

      // Check all orders are unique
      if (uniqueOrders.size !== orders.length) {
        return false;
      }

      // Check orders are sequential from 1 to n
      const sortedOrders = [...orders].sort((a, b) => a - b);
      const expectedOrders = Array.from({ length: orders.length }, (_, i) => i + 1);

      return JSON.stringify(sortedOrders) === JSON.stringify(expectedOrders);
    },
    { message: 'Los órdenes deben ser secuenciales comenzando desde 1 (1, 2, 3...)' }
  );

export const updateRoutineSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .optional(),
  description: z
    .string()
    .max(500, 'La descripción no puede exceder 500 caracteres')
    .nullable()
    .optional(),
  exercises: z
    .array(routineExerciseSchema)
    .min(1, 'La rutina debe tener al menos 1 ejercicio')
    .optional()
    .refine(
      (exercises) => {
        if (!exercises) return true;

        const orders = exercises.map((e) => e.order);
        const uniqueOrders = new Set(orders);

        if (uniqueOrders.size !== orders.length) {
          return false;
        }

        const sortedOrders = [...orders].sort((a, b) => a - b);
        const expectedOrders = Array.from({ length: orders.length }, (_, i) => i + 1);

        return JSON.stringify(sortedOrders) === JSON.stringify(expectedOrders);
      },
      { message: 'Los órdenes deben ser secuenciales comenzando desde 1 (1, 2, 3...)' }
    ),
});

export type CreateRoutineInput = z.infer<typeof createRoutineSchema>;
export type UpdateRoutineInput = z.infer<typeof updateRoutineSchema>;
export type CreateRoutineExerciseInput = z.infer<typeof routineExerciseSchema>;
