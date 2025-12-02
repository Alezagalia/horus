/**
 * HabitProgress Validation Schemas
 * Sprint 4 - US-032
 */

import { z } from 'zod';

/**
 * Schema for incremental progress update
 * Sprint 4 - US-032
 */
export const updateProgressSchema = z.object({
  increment: z
    .number({
      message: 'Increment must be a number',
    })
    .refine((val) => val !== 0, {
      message: 'Increment must not be zero',
    }),
});

/**
 * Type inference from schemas
 */
export type UpdateProgressInput = z.infer<typeof updateProgressSchema>;
