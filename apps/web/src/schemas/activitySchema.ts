import { z } from 'zod';

export const activitySchema = z
  .object({
    name: z.string().min(1, 'El nombre es requerido').max(100),
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
  })
  .superRefine((data, ctx) => {
    if (data.periodicity === 'WEEKLY' && data.weekDays.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Seleccioná al menos un día de la semana',
        path: ['weekDays'],
      });
    }
    if (data.periodicity === 'MONTHLY' && !data.timesPerMonth) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Indicá cuántas veces al mes',
        path: ['timesPerMonth'],
      });
    }
    if (data.timeMode === 'FIXED' && data.fixedHour == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Seleccioná la hora',
        path: ['fixedHour'],
      });
    }
    if (data.timeMode === 'AFTER_ACTIVITY' && !data.afterActivityId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Seleccioná la actividad previa',
        path: ['afterActivityId'],
      });
    }
  });

export type ActivityFormValues = z.infer<typeof activitySchema>;
