/**
 * Life Debt Service
 * F-14 - Deuda de Vida
 * Sprint 17
 *
 * Detects "debt" items across the user's domains:
 * - Tasks reprogrammed 3+ times
 * - Habits with a broken streak > 14 days
 * - Recurring expenses not reviewed in 6+ months
 *
 * Items can be hidden temporarily via LifeDebtDecision (commit/delegate)
 * or removed via decision = delete (soft delete of the underlying item).
 */

import type {
  LifeDebtDecisionKind,
  LifeDebtDecisionRequest,
  LifeDebtDecisionResponse,
  LifeDebtItem,
  LifeDebtItemType,
  LifeDebtResponse,
} from '@horus/shared';
import { prisma } from '../lib/prisma.js';
import { parseISODateToNoonUTC } from '../utils/date.utils.js';

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const TASK_RESCHEDULE_THRESHOLD = 3;
const HABIT_DAYS_BROKEN_THRESHOLD = 14;
const RECURRING_EXPENSE_MONTHS_THRESHOLD = 6;
const DECISION_HIDE_DAYS = 30;

function diffDays(later: Date, earlier: Date): number {
  return Math.floor((later.getTime() - earlier.getTime()) / MS_PER_DAY);
}

function monthsAgo(months: number, from: Date = new Date()): Date {
  const d = new Date(from);
  d.setUTCMonth(d.getUTCMonth() - months);
  return d;
}

function daysAgo(days: number, from: Date = new Date()): Date {
  const d = new Date(from);
  d.setUTCDate(d.getUTCDate() - days);
  return d;
}

/**
 * Returns a Set of `${itemType}:${itemId}` keys for items hidden by a recent
 * (≤30 days) unresolved-but-active decision (commit/delegate). Items with
 * `delete` decisions never re-appear because the underlying record is soft
 * deleted.
 */
async function getHiddenItemKeys(userId: string): Promise<Set<string>> {
  const cutoff = daysAgo(DECISION_HIDE_DAYS);
  const decisions = await prisma.lifeDebtDecision.findMany({
    where: {
      userId,
      decision: { in: ['commit', 'delegate'] },
      resolvedAt: { gte: cutoff },
    },
    select: { itemType: true, itemId: true },
    distinct: ['itemType', 'itemId'],
  });
  return new Set(decisions.map((d) => `${d.itemType}:${d.itemId}`));
}

async function detectTasks(userId: string, hidden: Set<string>): Promise<LifeDebtItem[]> {
  const tasks = await prisma.task.findMany({
    where: {
      userId,
      isActive: true,
      status: { in: ['pendiente', 'en_progreso'] },
      rescheduleCount: { gte: TASK_RESCHEDULE_THRESHOLD },
    },
    select: {
      id: true,
      title: true,
      dueDate: true,
      rescheduleCount: true,
      createdAt: true,
    },
  });

  const now = new Date();
  return tasks
    .filter((t) => !hidden.has(`task:${t.id}`))
    .map((t) => ({
      type: 'task' as LifeDebtItemType,
      id: t.id,
      title: t.title,
      reason: `Reprogramada ${t.rescheduleCount} veces`,
      agingDays: diffDays(now, t.createdAt),
      metadata: {
        rescheduleCount: t.rescheduleCount,
        currentDueDate: t.dueDate ? t.dueDate.toISOString().slice(0, 10) : null,
      },
    }));
}

async function detectHabits(userId: string, hidden: Set<string>): Promise<LifeDebtItem[]> {
  const cutoff = daysAgo(HABIT_DAYS_BROKEN_THRESHOLD);
  const habits = await prisma.habit.findMany({
    where: {
      userId,
      isActive: true,
      OR: [
        { lastCompletedDate: { lt: cutoff } },
        { lastCompletedDate: null, createdAt: { lt: cutoff } },
      ],
    },
    select: {
      id: true,
      name: true,
      lastCompletedDate: true,
      longestStreak: true,
      createdAt: true,
    },
  });

  const now = new Date();
  return habits
    .filter((h) => !hidden.has(`habit:${h.id}`))
    .map((h) => {
      const ref = h.lastCompletedDate ?? h.createdAt;
      const daysSince = diffDays(now, ref);
      return {
        type: 'habit' as LifeDebtItemType,
        id: h.id,
        title: h.name,
        reason: h.lastCompletedDate
          ? `Sin actividad hace ${daysSince} días (racha previa: ${h.longestStreak})`
          : `Creado hace ${daysSince} días, nunca completado`,
        agingDays: daysSince,
        metadata: {
          daysSinceLastCompletion: daysSince,
          streakBeforeBreak: h.longestStreak,
        },
      };
    });
}

async function detectRecurringExpenses(userId: string): Promise<LifeDebtItem[]> {
  const cutoff = monthsAgo(RECURRING_EXPENSE_MONTHS_THRESHOLD);
  const items = await prisma.recurringExpense.findMany({
    where: {
      userId,
      isActive: true,
      lastReviewedAt: { lt: cutoff },
    },
    select: {
      id: true,
      concept: true,
      lastReviewedAt: true,
    },
  });

  const now = new Date();
  return items.map((r) => {
    const daysSince = diffDays(now, r.lastReviewedAt);
    return {
      type: 'recurring_expense' as LifeDebtItemType,
      id: r.id,
      title: r.concept,
      reason: `Sin revisión hace ${Math.floor(daysSince / 30)} meses`,
      agingDays: daysSince,
      metadata: { daysSinceLastReview: daysSince },
    };
  });
}

export async function getLifeDebt(userId: string): Promise<LifeDebtResponse> {
  const hidden = await getHiddenItemKeys(userId);
  const [tasks, habits, recurringExpenses] = await Promise.all([
    detectTasks(userId, hidden),
    detectHabits(userId, hidden),
    detectRecurringExpenses(userId),
  ]);

  // Order each group by aging desc (oldest first within group, oldest groups first overall).
  const sortByAgingDesc = (a: LifeDebtItem, b: LifeDebtItem) => b.agingDays - a.agingDays;
  const items = [
    ...tasks.sort(sortByAgingDesc),
    ...habits.sort(sortByAgingDesc),
    ...recurringExpenses.sort(sortByAgingDesc),
  ];

  return {
    items,
    totals: {
      tasks: tasks.length,
      habits: habits.length,
      recurringExpenses: recurringExpenses.length,
      all: items.length,
    },
  };
}

// ---------------------------------------------------------------------------
// Apply decision
// ---------------------------------------------------------------------------

async function applyCommit(
  userId: string,
  itemType: LifeDebtItemType,
  itemId: string,
  commitDate: Date
): Promise<void> {
  if (itemType === 'task') {
    await prisma.task.updateMany({
      where: { id: itemId, userId, isActive: true },
      data: { dueDate: commitDate },
    });
  }
  // habit commit: only the decision row is created; no field on Habit changes.
}

async function applyDelete(
  userId: string,
  itemType: LifeDebtItemType,
  itemId: string
): Promise<void> {
  if (itemType === 'task') {
    await prisma.task.updateMany({
      where: { id: itemId, userId },
      data: { isActive: false, archivedAt: new Date() },
    });
  } else if (itemType === 'habit') {
    await prisma.habit.updateMany({
      where: { id: itemId, userId },
      data: { isActive: false },
    });
  }
}

export async function recordDecision(
  userId: string,
  input: LifeDebtDecisionRequest
): Promise<LifeDebtDecisionResponse> {
  // Verify the item belongs to the user before recording a decision.
  if (input.itemType === 'task') {
    const exists = await prisma.task.findFirst({
      where: { id: input.itemId, userId },
      select: { id: true },
    });
    if (!exists) throw new Error('Tarea no encontrada');
  } else if (input.itemType === 'habit') {
    const exists = await prisma.habit.findFirst({
      where: { id: input.itemId, userId },
      select: { id: true },
    });
    if (!exists) throw new Error('Hábito no encontrado');
  }

  const commitDate = input.commitDate ? parseISODateToNoonUTC(input.commitDate) : null;

  // Apply side effects first; if they fail the decision row is not persisted.
  if (input.decision === 'commit' && commitDate) {
    await applyCommit(userId, input.itemType, input.itemId, commitDate);
  } else if (input.decision === 'delete') {
    await applyDelete(userId, input.itemType, input.itemId);
  }
  // delegate has no side effects beyond the decision row itself.

  const record = await prisma.lifeDebtDecision.create({
    data: {
      userId,
      itemType: input.itemType,
      itemId: input.itemId,
      decision: input.decision as LifeDebtDecisionKind,
      commitDate,
      reason: input.reason ?? null,
      resolvedAt: new Date(),
    },
  });

  return {
    id: record.id,
    itemType: record.itemType as LifeDebtItemType,
    itemId: record.itemId,
    decision: record.decision as LifeDebtDecisionKind,
    commitDate: record.commitDate ? record.commitDate.toISOString().slice(0, 10) : null,
    reason: record.reason,
    createdAt: record.createdAt.toISOString(),
    resolvedAt: record.resolvedAt ? record.resolvedAt.toISOString() : null,
  };
}

export async function reviewRecurringExpense(
  userId: string,
  recurringExpenseId: string
): Promise<{ id: string; lastReviewedAt: string }> {
  const existing = await prisma.recurringExpense.findFirst({
    where: { id: recurringExpenseId, userId },
    select: { id: true },
  });
  if (!existing) throw new Error('Gasto recurrente no encontrado');

  const updated = await prisma.recurringExpense.update({
    where: { id: recurringExpenseId },
    data: { lastReviewedAt: new Date() },
    select: { id: true, lastReviewedAt: true },
  });

  return {
    id: updated.id,
    lastReviewedAt: updated.lastReviewedAt.toISOString(),
  };
}

export const lifeDebtService = {
  getLifeDebt,
  recordDecision,
  reviewRecurringExpense,
};
