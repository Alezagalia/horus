/**
 * Analytics Validation Schemas
 * F-07 - Reportes y Tendencias
 * Sprint 15 - US-141
 */

import { z } from 'zod';
import { COMPARABLE_DIMENSIONS, type ComparableDimension } from '../types/analytics.types.js';

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const MAX_RANGE_DAYS = 366;

const isoDateSchema = z
  .string()
  .regex(ISO_DATE_REGEX, 'Date must be in YYYY-MM-DD format')
  .refine((value) => !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime()), {
    message: 'Date must be a valid calendar date',
  });

const diffInDaysInclusive = (from: string, to: string): number => {
  const fromTs = new Date(`${from}T00:00:00Z`).getTime();
  const toTs = new Date(`${to}T00:00:00Z`).getTime();
  return Math.floor((toTs - fromTs) / (1000 * 60 * 60 * 24)) + 1;
};

/**
 * Range query used by overview, productivity and other generic range endpoints.
 * Both `from` and `to` are optional at the schema level — defaults are applied
 * by the caller (typically last 30 days).
 */
export const analyticsRangeQuerySchema = z
  .object({
    from: isoDateSchema.optional(),
    to: isoDateSchema.optional(),
  })
  .refine((data) => (data.from && data.to ? data.from <= data.to : true), {
    message: '`from` must be earlier than or equal to `to`',
    path: ['from'],
  })
  .refine(
    (data) =>
      data.from && data.to ? diffInDaysInclusive(data.from, data.to) <= MAX_RANGE_DAYS : true,
    {
      message: `Range cannot exceed ${MAX_RANGE_DAYS} days`,
      path: ['to'],
    }
  );

export type AnalyticsRangeQuery = z.infer<typeof analyticsRangeQuerySchema>;

/**
 * Heatmap query — single `year` parameter between 2020 and the current year.
 */
export const heatmapQuerySchema = z.object({
  year: z.coerce
    .number()
    .int('Year must be an integer')
    .min(2020, 'Year must be 2020 or later')
    .max(new Date().getUTCFullYear(), 'Year cannot be in the future')
    .optional(),
});

export type HeatmapQuery = z.infer<typeof heatmapQuerySchema>;

/**
 * Finance trends query — number of months to look back (1..24).
 */
export const financeTrendsQuerySchema = z.object({
  months: z.coerce
    .number()
    .int('Months must be an integer')
    .min(1, 'Months must be at least 1')
    .max(24, 'Months cannot exceed 24')
    .optional()
    .default(6),
});

export type FinanceTrendsQuery = z.infer<typeof financeTrendsQuerySchema>;

/**
 * Productivity query — same shape as the generic range query but exported
 * with its own name for clarity and future divergence.
 */
export const productivityQuerySchema = analyticsRangeQuerySchema;
export type ProductivityQuery = AnalyticsRangeQuery;

/**
 * Compare query — two ranges plus the list of dimensions to compute.
 * Accepts `dimensions` as either an array or a comma-separated string.
 */
const comparableDimensionSchema = z.enum(
  COMPARABLE_DIMENSIONS as readonly [ComparableDimension, ...ComparableDimension[]]
);

const dimensionsParamSchema = z
  .union([
    z.array(comparableDimensionSchema),
    z
      .string()
      .transform((value) =>
        value
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      )
      .pipe(z.array(comparableDimensionSchema)),
  ])
  .optional();

export const compareQuerySchema = z
  .object({
    currentFrom: isoDateSchema,
    currentTo: isoDateSchema,
    previousFrom: isoDateSchema,
    previousTo: isoDateSchema,
    dimensions: dimensionsParamSchema,
  })
  .refine((data) => data.currentFrom <= data.currentTo, {
    message: '`currentFrom` must be earlier than or equal to `currentTo`',
    path: ['currentFrom'],
  })
  .refine((data) => data.previousFrom <= data.previousTo, {
    message: '`previousFrom` must be earlier than or equal to `previousTo`',
    path: ['previousFrom'],
  })
  .refine((data) => diffInDaysInclusive(data.currentFrom, data.currentTo) <= MAX_RANGE_DAYS, {
    message: `Current range cannot exceed ${MAX_RANGE_DAYS} days`,
    path: ['currentTo'],
  })
  .refine((data) => diffInDaysInclusive(data.previousFrom, data.previousTo) <= MAX_RANGE_DAYS, {
    message: `Previous range cannot exceed ${MAX_RANGE_DAYS} days`,
    path: ['previousTo'],
  });

export type CompareQuery = z.infer<typeof compareQuerySchema>;
