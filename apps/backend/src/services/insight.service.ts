/**
 * Insight Service — pattern-detection engine
 * F-12 - Motor de Correlaciones Personales
 * Sprint 18
 *
 * Runs 4 detectors over the user's historical data and upserts the result
 * as Insight rows. Each detector identifies a single specific pattern.
 * No AI: only deterministic statistics on the user's own records.
 */

import type { InsightSeverity } from '@horus/shared';
import { Prisma } from '../generated/prisma/client.js';
import { prisma } from '../lib/prisma.js';

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const MIN_DAYS_OF_DATA = 60;
const DISMISSAL_HIDE_DAYS = 30;

const DAY_NAMES_LOWER = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function diffDays(later: Date, earlier: Date): number {
  return Math.floor((later.getTime() - earlier.getTime()) / MS_PER_DAY);
}

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function isoWeekKey(date: Date): string {
  // ISO week: Thursday-of-week determines the year/week.
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / MS_PER_DAY + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function pearson(xs: number[], ys: number[]): number | null {
  if (xs.length !== ys.length || xs.length < 3) return null;
  const n = xs.length;
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let denX = 0;
  let denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  const denom = Math.sqrt(denX * denY);
  if (denom === 0) return null;
  return num / denom;
}

function pctDiff(a: number, b: number): number {
  if (b === 0) return 0;
  return Math.round(((a - b) / b) * 100);
}

/**
 * Returns the number of calendar days between the user's earliest activity
 * (first habit, task, transaction, workout, etc.) and today.
 */
async function getDaysOfData(userId: string): Promise<number> {
  const [habit, task, tx, workout] = await Promise.all([
    prisma.habit.findFirst({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    }),
    prisma.task.findFirst({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    }),
    prisma.transaction.findFirst({
      where: { userId },
      orderBy: { date: 'asc' },
      select: { date: true },
    }),
    prisma.workout.findFirst({
      where: { userId },
      orderBy: { startTime: 'asc' },
      select: { startTime: true },
    }),
  ]);

  const dates = [habit?.createdAt, task?.createdAt, tx?.date, workout?.startTime].filter(
    (d): d is Date => d instanceof Date
  );
  if (dates.length === 0) return 0;
  const earliest = dates.reduce((min, d) => (d < min ? d : min), dates[0]);
  return diffDays(new Date(), earliest);
}

// ---------------------------------------------------------------------------
// Detectors
// ---------------------------------------------------------------------------

interface InsightCandidate {
  kind: string;
  title: string;
  description: string;
  severity: InsightSeverity;
  data: Record<string, unknown>;
}

async function detectWorstDayOfWeek(userId: string): Promise<InsightCandidate | null> {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setUTCDate(ninetyDaysAgo.getUTCDate() - 89);

  const tasks = await prisma.task.findMany({
    where: {
      userId,
      status: 'completada',
      completedAt: { gte: ninetyDaysAgo },
    },
    select: { completedAt: true },
  });
  if (tasks.length < 14) return null;

  const counts = new Array(7).fill(0) as number[];
  for (const t of tasks) {
    if (!t.completedAt) continue;
    counts[t.completedAt.getUTCDay()] += 1;
  }

  let bestIdx = 0;
  let worstIdx = 0;
  for (let i = 1; i < 7; i++) {
    if (counts[i] > counts[bestIdx]) bestIdx = i;
    if (counts[i] < counts[worstIdx]) worstIdx = i;
  }
  const best = counts[bestIdx];
  const worst = counts[worstIdx];
  if (worst < 3) return null; // not enough to compare
  if (best < worst * 1.3) return null; // gap too small

  const gapPct = pctDiff(best, worst);
  return {
    kind: 'productivity.worst-dow',
    title: `Tus ${DAY_NAMES_LOWER[worstIdx]}s son tu día menos productivo`,
    description: `En los últimos 90 días completaste ${worst} tareas los ${DAY_NAMES_LOWER[worstIdx]}s vs ${best} los ${DAY_NAMES_LOWER[bestIdx]}s (gap de ${gapPct}%).`,
    severity: 'neutral',
    data: { worstDayOfWeek: worstIdx, bestDayOfWeek: bestIdx, worst, best, gapPct },
  };
}

async function detectWorkoutTasksBoost(userId: string): Promise<InsightCandidate | null> {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setUTCDate(ninetyDaysAgo.getUTCDate() - 89);

  const [tasks, workouts] = await Promise.all([
    prisma.task.findMany({
      where: { userId, status: 'completada', completedAt: { gte: ninetyDaysAgo } },
      select: { completedAt: true },
    }),
    prisma.workout.findMany({
      where: { userId, endTime: { gte: ninetyDaysAgo, not: null } },
      select: { endTime: true },
    }),
  ]);
  if (workouts.length < 5) return null;

  const workoutDays = new Set<string>();
  for (const w of workouts) {
    if (w.endTime) workoutDays.add(dayKey(w.endTime));
  }

  const tasksByDay = new Map<string, number>();
  for (const t of tasks) {
    if (!t.completedAt) continue;
    const k = dayKey(t.completedAt);
    tasksByDay.set(k, (tasksByDay.get(k) ?? 0) + 1);
  }

  // Walk through every day in the window to compare with-workout vs without.
  const tasksWith: number[] = [];
  const tasksWithout: number[] = [];
  const cursor = new Date(ninetyDaysAgo);
  const today = new Date();
  while (cursor.getTime() <= today.getTime()) {
    const k = dayKey(cursor);
    const c = tasksByDay.get(k) ?? 0;
    if (workoutDays.has(k)) tasksWith.push(c);
    else tasksWithout.push(c);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  if (tasksWith.length < 5 || tasksWithout.length < 5) return null;

  const avgWith = tasksWith.reduce((a, b) => a + b, 0) / tasksWith.length;
  const avgWithout = tasksWithout.reduce((a, b) => a + b, 0) / tasksWithout.length;
  if (avgWithout === 0) return null;
  const ratio = avgWith / avgWithout;
  if (ratio < 1.2 && ratio > 0.8) return null; // not significant

  const pct = Math.round((ratio - 1) * 100);
  const positive = ratio >= 1;
  return {
    kind: 'workout.tasks-boost',
    title: positive
      ? `Los días con workout completás un ${Math.abs(pct)}% más tareas`
      : `Los días con workout completás un ${Math.abs(pct)}% menos tareas`,
    description: positive
      ? `Promedio de ${avgWith.toFixed(1)} tareas en días con entrenamiento vs ${avgWithout.toFixed(1)} en días sin. Es una señal de que el ejercicio te activa.`
      : `Promedio de ${avgWith.toFixed(1)} tareas en días con entrenamiento vs ${avgWithout.toFixed(1)} en días sin. ¿El workout te agota la energía del día?`,
    severity: positive ? 'positive' : 'negative',
    data: {
      avgWith,
      avgWithout,
      ratio,
      withDays: tasksWith.length,
      withoutDays: tasksWithout.length,
    },
  };
}

async function detectSpendingHabitsCorrelation(userId: string): Promise<InsightCandidate | null> {
  const twelveWeeksAgo = new Date();
  twelveWeeksAgo.setUTCDate(twelveWeeksAgo.getUTCDate() - 12 * 7);

  const [transactions, habitRecords] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        userId,
        type: 'egreso',
        isTransfer: false,
        date: { gte: twelveWeeksAgo },
      },
      select: { amount: true, date: true },
    }),
    prisma.habitRecord.findMany({
      where: { userId, date: { gte: twelveWeeksAgo } },
      select: { completed: true, date: true },
    }),
  ]);

  const spendByWeek = new Map<string, number>();
  for (const tx of transactions) {
    const k = isoWeekKey(tx.date);
    spendByWeek.set(k, (spendByWeek.get(k) ?? 0) + Number(tx.amount.toString()));
  }

  // Adherence per week = completed / total records.
  const recordTotals = new Map<string, { completed: number; total: number }>();
  for (const r of habitRecords) {
    const k = isoWeekKey(r.date);
    const cur = recordTotals.get(k) ?? { completed: 0, total: 0 };
    cur.total += 1;
    if (r.completed) cur.completed += 1;
    recordTotals.set(k, cur);
  }

  // Only weeks with data in both series.
  const weeks = Array.from(new Set([...spendByWeek.keys(), ...recordTotals.keys()])).filter(
    (w) => spendByWeek.has(w) && recordTotals.has(w)
  );
  if (weeks.length < 8) return null;

  const xs: number[] = [];
  const ys: number[] = [];
  for (const w of weeks) {
    xs.push(spendByWeek.get(w) ?? 0);
    const rt = recordTotals.get(w)!;
    ys.push(rt.total === 0 ? 0 : rt.completed / rt.total);
  }
  const r = pearson(xs, ys);
  if (r === null || Math.abs(r) < 0.4) return null;

  const negative = r < 0;
  return {
    kind: 'spending.habits-corr',
    title: negative
      ? 'Tus semanas de mayor gasto coinciden con caídas en tu adherencia a hábitos'
      : 'Tus semanas de mayor gasto coinciden con subas en tu adherencia a hábitos',
    description: negative
      ? `Detectamos una correlación negativa (r=${r.toFixed(2)}) sobre ${weeks.length} semanas. Cuando gastás más, tendés a soltar tus hábitos.`
      : `Detectamos una correlación positiva (r=${r.toFixed(2)}) sobre ${weeks.length} semanas. Quizás compartan un mismo gatillo de actividad.`,
    severity: negative ? 'negative' : 'neutral',
    data: { r, weeks: weeks.length },
  };
}

async function detectStreakProductivityBoost(userId: string): Promise<InsightCandidate | null> {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setUTCDate(ninetyDaysAgo.getUTCDate() - 89);

  const [habitRecords, tasks] = await Promise.all([
    prisma.habitRecord.findMany({
      where: { userId, completed: true, date: { gte: ninetyDaysAgo } },
      select: { date: true },
    }),
    prisma.task.findMany({
      where: { userId, status: 'completada', completedAt: { gte: ninetyDaysAgo } },
      select: { completedAt: true },
    }),
  ]);
  if (habitRecords.length < 30 || tasks.length < 14) return null;

  const habitsByDay = new Map<string, number>();
  for (const r of habitRecords) {
    const k = dayKey(r.date);
    habitsByDay.set(k, (habitsByDay.get(k) ?? 0) + 1);
  }
  const tasksByDay = new Map<string, number>();
  for (const t of tasks) {
    if (!t.completedAt) continue;
    const k = dayKey(t.completedAt);
    tasksByDay.set(k, (tasksByDay.get(k) ?? 0) + 1);
  }

  // "Streak day" proxy: a day with >= 3 habits completed.
  const tasksOnStreak: number[] = [];
  const tasksOffStreak: number[] = [];
  const cursor = new Date(ninetyDaysAgo);
  const today = new Date();
  while (cursor.getTime() <= today.getTime()) {
    const k = dayKey(cursor);
    const habitCount = habitsByDay.get(k) ?? 0;
    const taskCount = tasksByDay.get(k) ?? 0;
    if (habitCount >= 3) tasksOnStreak.push(taskCount);
    else tasksOffStreak.push(taskCount);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  if (tasksOnStreak.length < 7 || tasksOffStreak.length < 7) return null;

  const avgOn = tasksOnStreak.reduce((a, b) => a + b, 0) / tasksOnStreak.length;
  const avgOff = tasksOffStreak.reduce((a, b) => a + b, 0) / tasksOffStreak.length;
  if (avgOff === 0) return null;
  const ratio = avgOn / avgOff;
  if (ratio < 1.2) return null; // only flag positive boost

  const pct = Math.round((ratio - 1) * 100);
  return {
    kind: 'streak.productivity-boost',
    title: `Cuando estás en racha completás un ${pct}% más tareas`,
    description: `En los días donde cumpliste 3+ hábitos, promediás ${avgOn.toFixed(1)} tareas vs ${avgOff.toFixed(1)} en los demás. La consistencia se contagia.`,
    severity: 'positive',
    data: {
      avgOnStreak: avgOn,
      avgOffStreak: avgOff,
      ratio,
      daysOn: tasksOnStreak.length,
      daysOff: tasksOffStreak.length,
    },
  };
}

// ---------------------------------------------------------------------------
// Upsert / orchestration
// ---------------------------------------------------------------------------

async function upsertCandidate(userId: string, candidate: InsightCandidate): Promise<void> {
  const existing = await prisma.insight.findUnique({
    where: { userId_kind: { userId, kind: candidate.kind } },
  });

  if (existing) {
    // If dismissed recently, leave it hidden.
    if (existing.dismissedAt && diffDays(new Date(), existing.dismissedAt) < DISMISSAL_HIDE_DAYS) {
      return;
    }
    await prisma.insight.update({
      where: { id: existing.id },
      data: {
        title: candidate.title,
        description: candidate.description,
        severity: candidate.severity,
        data: candidate.data as Prisma.InputJsonValue,
        detectedAt: new Date(),
        // Clear dismissed/seen if the pattern came back after the hide window.
        dismissedAt: null,
        seenAt: null,
      },
    });
  } else {
    await prisma.insight.create({
      data: {
        userId,
        kind: candidate.kind,
        title: candidate.title,
        description: candidate.description,
        severity: candidate.severity,
        data: candidate.data as Prisma.InputJsonValue,
      },
    });
  }
}

async function runDetectors(userId: string): Promise<void> {
  const detectors = [
    detectWorstDayOfWeek,
    detectWorkoutTasksBoost,
    detectSpendingHabitsCorrelation,
    detectStreakProductivityBoost,
  ];
  const results = await Promise.all(detectors.map((d) => d(userId)));
  for (const candidate of results) {
    if (candidate) await upsertCandidate(userId, candidate);
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getInsights(userId: string) {
  const daysOfData = await getDaysOfData(userId);
  if (daysOfData < MIN_DAYS_OF_DATA) {
    return { insights: [], notEnoughData: true, daysOfData };
  }

  await runDetectors(userId);

  const rows = await prisma.insight.findMany({
    where: { userId, dismissedAt: null },
    orderBy: [{ severity: 'asc' }, { detectedAt: 'desc' }],
  });

  return {
    insights: rows.map((r) => ({
      id: r.id,
      kind: r.kind,
      title: r.title,
      description: r.description,
      severity: r.severity as 'positive' | 'neutral' | 'negative',
      data: r.data as Record<string, unknown>,
      detectedAt: r.detectedAt.toISOString(),
      seenAt: r.seenAt ? r.seenAt.toISOString() : null,
      dismissedAt: r.dismissedAt ? r.dismissedAt.toISOString() : null,
    })),
    notEnoughData: false,
    daysOfData,
  };
}

export async function dismissInsight(userId: string, insightId: string): Promise<void> {
  const result = await prisma.insight.updateMany({
    where: { id: insightId, userId },
    data: { dismissedAt: new Date() },
  });
  if (result.count === 0) throw new Error('Insight no encontrado');
}

export async function markSeenInsight(userId: string, insightId: string): Promise<void> {
  const result = await prisma.insight.updateMany({
    where: { id: insightId, userId, seenAt: null },
    data: { seenAt: new Date() },
  });
  // 0 rows updated is fine — the user may be marking something already seen.
  void result;
}

export const insightService = {
  getInsights,
  dismissInsight,
  markSeenInsight,
  __test: { pearson, isoWeekKey, getDaysOfData },
};
