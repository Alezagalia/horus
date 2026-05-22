/**
 * Timeline Validation Schemas
 * F-16 - Arqueología Personal
 * Sprint 16 - US-151
 */

import { z } from 'zod';
import {
  TIMELINE_CATEGORIES,
  TIMELINE_MODULES,
  type TimelineEventCategory,
  type TimelineModule,
} from '../types/timeline.types.js';

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const isoDateSchema = z
  .string()
  .regex(ISO_DATE_REGEX, 'Date must be in YYYY-MM-DD format')
  .refine((value) => !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime()), {
    message: 'Date must be a valid calendar date',
  });

const moduleSchema = z.enum(TIMELINE_MODULES as readonly [TimelineModule, ...TimelineModule[]]);
const categorySchema = z.enum(
  TIMELINE_CATEGORIES as readonly [TimelineEventCategory, ...TimelineEventCategory[]]
);

const splitCsv = (value: string): string[] =>
  value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

const modulesParamSchema = z
  .union([z.array(moduleSchema), z.string().transform(splitCsv).pipe(z.array(moduleSchema))])
  .optional();

const categoriesParamSchema = z
  .union([z.array(categorySchema), z.string().transform(splitCsv).pipe(z.array(categorySchema))])
  .optional();

export const timelineQuerySchema = z
  .object({
    from: isoDateSchema.optional(),
    to: isoDateSchema.optional(),
    modules: modulesParamSchema,
    categories: categoriesParamSchema,
    limit: z.coerce.number().int().min(1).max(200).optional().default(100),
    offset: z.coerce.number().int().min(0).optional().default(0),
  })
  .refine((data) => (data.from && data.to ? data.from <= data.to : true), {
    message: '`from` must be earlier than or equal to `to`',
    path: ['from'],
  });

export type TimelineQuery = z.infer<typeof timelineQuerySchema>;
