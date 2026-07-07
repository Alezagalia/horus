/**
 * Replication Validation Schemas (offline-first Fase 1)
 *
 * Validación LAXA del envelope del push: shape por tabla (created/updated =
 * objetos con id string, deleted = ids). La semántica de cada campo la validan
 * los handlers de `services/replication/tables/*` (ownership, invariantes),
 * porque el contrato Watermelon manda filas raw completas y rechazar el batch
 * entero por un campo cosmético dejaría al cliente atascado.
 */

import { z } from 'zod';

const rawRowSchema = z.looseObject({
  id: z.string().min(1).max(64),
});

const tableChangesSchema = z
  .object({
    created: z.array(rawRowSchema).max(10_000).optional(),
    updated: z.array(rawRowSchema).max(10_000).optional(),
    deleted: z.array(z.string().min(1).max(64)).max(10_000).optional(),
  })
  .optional();

export const pushEnvelopeSchema = z.object({
  changes: z.object({
    accounts: tableChangesSchema,
    categories: tableChangesSchema,
    transactions: tableChangesSchema,
    recurring_expenses: tableChangesSchema,
    monthly_expense_instances: tableChangesSchema,
    budgets: tableChangesSchema,
    savings_goals: tableChangesSchema,
    habits: tableChangesSchema,
    habit_records: tableChangesSchema,
    tasks: tableChangesSchema,
    task_checklist_items: tableChangesSchema,
  }),
  lastPulledAt: z.number().int().nonnegative().nullable().optional(),
});

export type PushEnvelope = z.infer<typeof pushEnvelopeSchema>;
