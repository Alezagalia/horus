import { z } from 'zod';

export const createActivitySchema = z.object({
  name: z.string().min(1).max(100).trim(),
  description: z.string().max(500).optional(),
  content: z.string().optional(),
  periodicity: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']).default('DAILY'),
  weekDays: z.array(z.number().int().min(0).max(6)).default([]),
  timesPerMonth: z.number().int().min(1).max(31).optional().nullable(),
  timeMode: z.enum(['FIXED', 'AFTER_ACTIVITY']).default('FIXED'),
  fixedHour: z.number().int().min(0).max(23).optional().nullable(),
  fixedMinute: z.number().int().min(0).max(59).optional().nullable(),
  afterActivityId: z.string().uuid().optional().nullable(),
  durationMinutes: z.number().int().min(1).optional().nullable(),
  emoji: z.string().max(10).optional(),
  color: z.string().max(20).optional(),
  order: z.number().int().default(0),
});

export const updateActivitySchema = createActivitySchema.partial();

export const toggleActivityRecordSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  completed: z.boolean(),
  skipped: z.boolean().optional(),
  notes: z.string().max(500).optional().nullable(),
});

export const getActivitiesQuerySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});
