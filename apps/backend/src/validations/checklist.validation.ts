/**
 * Checklist Validation Schemas
 * Sprint 7 - US-058
 */

import { z } from 'zod';

export const createChecklistItemSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200).trim(),
});

export const updateChecklistItemSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200).trim().optional(),
  completed: z.boolean().optional(),
});

export const reorderChecklistItemsSchema = z.object({
  items: z
    .array(
      z.object({
        itemId: z.string().uuid('Item ID must be a valid UUID'),
        position: z.number().int().min(0, 'Position must be a non-negative integer'),
      })
    )
    .min(1, 'At least one item is required'),
});
