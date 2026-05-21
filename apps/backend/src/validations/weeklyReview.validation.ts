/**
 * Weekly Review Validations (F-03)
 */

import { z } from 'zod';

export const createReviewSchema = z.object({
  weekStart: z.string().datetime({ offset: true }).or(z.string().date()),
});

export const updateReviewSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.string().uuid(),
        answer: z.string().min(1),
      })
    )
    .optional(),
  focusGoalIds: z.array(z.string().uuid()).optional(),
  focusTaskIds: z.array(z.string().uuid()).optional(),
  completedAt: z.string().datetime({ offset: true }).nullable().optional(),
});

export const createQuestionSchema = z.object({
  text: z.string().min(1).max(300),
  order: z.number().int().optional(),
});

export const updateQuestionSchema = z.object({
  text: z.string().min(1).max(300).optional(),
  order: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;
