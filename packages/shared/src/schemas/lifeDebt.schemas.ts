/**
 * Life Debt Validation Schemas
 * F-14 - Deuda de Vida
 * Sprint 17
 */

import { z } from 'zod';
import {
  LIFE_DEBT_DECISION_KINDS,
  LIFE_DEBT_ITEM_TYPES,
  type LifeDebtDecisionKind,
  type LifeDebtItemType,
} from '../types/lifeDebt.types.js';

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const isoDateSchema = z
  .string()
  .regex(ISO_DATE_REGEX, 'Date must be in YYYY-MM-DD format')
  .refine((value) => !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime()), {
    message: 'Date must be a valid calendar date',
  });

const itemTypeSchema = z.enum(
  LIFE_DEBT_ITEM_TYPES as readonly [LifeDebtItemType, ...LifeDebtItemType[]]
);

const decisionKindSchema = z.enum(
  LIFE_DEBT_DECISION_KINDS as readonly [LifeDebtDecisionKind, ...LifeDebtDecisionKind[]]
);

export const lifeDebtDecisionRequestSchema = z
  .object({
    itemType: itemTypeSchema,
    itemId: z.string().uuid('itemId must be a UUID'),
    decision: decisionKindSchema,
    commitDate: isoDateSchema.optional(),
    reason: z.string().max(500).optional(),
  })
  .refine(
    (data) => {
      if (data.decision === 'commit') return !!data.commitDate;
      return true;
    },
    { message: 'commitDate is required when decision = commit', path: ['commitDate'] }
  )
  .refine(
    (data) => {
      // Recurring expenses are reviewed via a dedicated endpoint, not via decisions.
      return data.itemType !== 'recurring_expense';
    },
    { message: 'recurring_expense items use the review endpoint', path: ['itemType'] }
  );

export type LifeDebtDecisionRequestInput = z.infer<typeof lifeDebtDecisionRequestSchema>;
