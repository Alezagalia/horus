/**
 * Analytics Service
 * F-07 - Reportes y Tendencias
 * Sprint 15 - US-142, US-143
 *
 * Aggregations for analytics endpoints. Each domain helper is exported
 * individually so future endpoints (productivity, compare) can reuse the
 * same primitives.
 */

import {
  COMPARABLE_DIMENSIONS,
  type AnalyticsOverview,
  type AnalyticsOverviewFinance,
  type AnalyticsOverviewGoals,
  type AnalyticsOverviewHabits,
  type AnalyticsOverviewTasks,
  type AnalyticsOverviewWorkouts,
  type AnalyticsPeriod,
  type FinanceTrendCategorySeries,
  type FinanceTrends,
  type FinanceTrendsProjection,
  type HabitHeatmap,
  type HabitHeatmapBestDay,
  type HabitHeatmapDay,
  type HabitHeatmapLevel,
  type Productivity,
  type ProductivityDayOfWeek,
  type ProductivityHourOfDay,
  type ProductivityHeatmapCell,
  type DayOfWeekIndex,
  type ComparableDimension,
  type ComparisonMetrics,
  type ComparisonValue,
  type PeriodComparison,
} from '@horus/shared';
import { prisma } from '../lib/prisma.js';
import {
  formatDateString,
  normalizeToUTCNoon,
  parseISODateToNoonUTC,
} from '../utils/date.utils.js';
import { debiaRealizarseEnFecha } from './streak.service.js';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Build the AnalyticsPeriod descriptor (inclusive day count) from two
 * normalized noon-UTC dates.
 */
export function buildPeriod(from: Date, to: Date): AnalyticsPeriod {
  const fromN = normalizeToUTCNoon(from);
  const toN = normalizeToUTCNoon(to);
  const days = Math.floor((toN.getTime() - fromN.getTime()) / MS_PER_DAY) + 1;
  return {
    from: formatDateString(fromN),
    to: formatDateString(toN),
    days,
  };
}

/**
 * Returns the default period (last 30 calendar days, inclusive of today).
 */
export function defaultOverviewRange(): { from: Date; to: Date } {
  const todayNoon = normalizeToUTCNoon(new Date());
  const from = new Date(todayNoon);
  from.setUTCDate(from.getUTCDate() - 29);
  return { from, to: todayNoon };
}

/**
 * Resolve the requested date range from optional ISO strings, applying the
 * 30-day default when neither edge is provided.
 */
export function resolveOverviewRange(fromStr?: string, toStr?: string): { from: Date; to: Date } {
  if (!fromStr && !toStr) {
    return defaultOverviewRange();
  }
  const todayNoon = normalizeToUTCNoon(new Date());
  const to = toStr ? parseISODateToNoonUTC(toStr) : todayNoon;
  const from = fromStr
    ? parseISODateToNoonUTC(fromStr)
    : (() => {
        const d = new Date(to);
        d.setUTCDate(d.getUTCDate() - 29);
        return d;
      })();
  return { from, to };
}

// ---------------------------------------------------------------------------
// Habits
// ---------------------------------------------------------------------------

interface HabitForExpectation {
  id: string;
  periodicity: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';
  weekDays: number[];
  createdAt: Date;
  longestStreak: number;
}

function iterateDays(from: Date, to: Date, callback: (day: Date) => void): void {
  const cursor = new Date(from);
  while (cursor.getTime() <= to.getTime()) {
    callback(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
}

/**
 * Computes the number of completions that *should* have happened in the range
 * for the given habits, taking each habit's periodicity, weekDays and
 * createdAt into account.
 */
function computeExpectedCompletions(habits: HabitForExpectation[], from: Date, to: Date): number {
  let expected = 0;
  for (const habit of habits) {
    const createdAtNoon = normalizeToUTCNoon(habit.createdAt);
    iterateDays(from, to, (day) => {
      if (day.getTime() < createdAtNoon.getTime()) return;
      if (debiaRealizarseEnFecha(habit, day)) {
        expected += 1;
      }
    });
  }
  return expected;
}

export async function getHabitsOverview(
  userId: string,
  from: Date,
  to: Date
): Promise<AnalyticsOverviewHabits> {
  const habits = await prisma.habit.findMany({
    where: {
      userId,
      OR: [{ isActive: true }, { isActive: false, updatedAt: { gte: from } }],
      createdAt: { lte: to },
    },
    select: {
      id: true,
      periodicity: true,
      weekDays: true,
      createdAt: true,
      longestStreak: true,
    },
  });

  if (habits.length === 0) {
    return {
      totalCompletions: 0,
      uniqueHabitsCompleted: 0,
      completionRate: 0,
      longestStreakInPeriod: 0,
    };
  }

  const habitIds = habits.map((h) => h.id);

  const [totalCompletions, distinctHabits] = await Promise.all([
    prisma.habitRecord.count({
      where: {
        userId,
        habitId: { in: habitIds },
        completed: true,
        date: { gte: from, lte: to },
      },
    }),
    prisma.habitRecord.findMany({
      where: {
        userId,
        habitId: { in: habitIds },
        completed: true,
        date: { gte: from, lte: to },
      },
      distinct: ['habitId'],
      select: { habitId: true },
    }),
  ]);

  const expected = computeExpectedCompletions(habits, from, to);
  const completionRate = expected > 0 ? Math.min(1, totalCompletions / expected) : 0;
  const longestStreakInPeriod = habits.reduce(
    (max, h) => (h.longestStreak > max ? h.longestStreak : max),
    0
  );

  return {
    totalCompletions,
    uniqueHabitsCompleted: distinctHabits.length,
    completionRate: Number(completionRate.toFixed(4)),
    longestStreakInPeriod,
  };
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

export async function getTasksOverview(
  userId: string,
  from: Date,
  to: Date
): Promise<AnalyticsOverviewTasks> {
  const [completed, pendingActive] = await Promise.all([
    prisma.task.count({
      where: {
        userId,
        status: 'completada',
        completedAt: { gte: from, lte: to },
      },
    }),
    prisma.task.findMany({
      where: {
        userId,
        isActive: true,
        status: { in: ['pendiente', 'en_progreso'] },
        createdAt: { lte: to },
      },
      select: { id: true, dueDate: true },
    }),
  ]);

  const pending = pendingActive.length;
  const overdue = pendingActive.filter(
    (t) => t.dueDate !== null && t.dueDate.getTime() < to.getTime()
  ).length;

  const denominator = completed + overdue;
  const completionRate = denominator > 0 ? Number((completed / denominator).toFixed(4)) : 0;

  return {
    completed,
    pending,
    overdue,
    completionRate,
  };
}

// ---------------------------------------------------------------------------
// Finance
// ---------------------------------------------------------------------------

export async function getFinanceOverview(
  userId: string,
  from: Date,
  to: Date
): Promise<AnalyticsOverviewFinance> {
  const [incomeAgg, expenseAgg, count] = await Promise.all([
    prisma.transaction.aggregate({
      where: {
        userId,
        type: 'ingreso',
        isTransfer: false,
        date: { gte: from, lte: to },
      },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: {
        userId,
        type: 'egreso',
        isTransfer: false,
        date: { gte: from, lte: to },
      },
      _sum: { amount: true },
    }),
    prisma.transaction.count({
      where: {
        userId,
        isTransfer: false,
        date: { gte: from, lte: to },
      },
    }),
  ]);

  const income = incomeAgg._sum.amount ? Number(incomeAgg._sum.amount.toString()) : 0;
  const expense = expenseAgg._sum.amount ? Number(expenseAgg._sum.amount.toString()) : 0;

  return {
    income,
    expense,
    net: Number((income - expense).toFixed(2)),
    transactionCount: count,
  };
}

// ---------------------------------------------------------------------------
// Workouts
// ---------------------------------------------------------------------------

export async function getWorkoutsOverview(
  userId: string,
  from: Date,
  to: Date
): Promise<AnalyticsOverviewWorkouts> {
  const workouts = await prisma.workout.findMany({
    where: {
      userId,
      endTime: { gte: from, lte: to, not: null },
    },
    select: {
      id: true,
      workoutExercises: {
        select: {
          workoutSets: {
            where: { completed: true },
            select: { reps: true, weight: true },
          },
        },
      },
    },
  });

  let totalVolume = 0;
  for (const w of workouts) {
    for (const we of w.workoutExercises) {
      for (const set of we.workoutSets) {
        const weight = Number(set.weight.toString());
        totalVolume += set.reps * weight;
      }
    }
  }

  return {
    completed: workouts.length,
    totalVolume: Number(totalVolume.toFixed(2)),
  };
}

// ---------------------------------------------------------------------------
// Goals
// ---------------------------------------------------------------------------

export async function getGoalsOverview(
  userId: string,
  from: Date,
  to: Date
): Promise<AnalyticsOverviewGoals> {
  const [activeGoals, completedInPeriod] = await Promise.all([
    prisma.goal.findMany({
      where: { userId, isActive: true, status: 'en_progreso' },
      select: {
        id: true,
        keyResults: {
          where: { isActive: true },
          select: { targetValue: true, currentValue: true },
        },
      },
    }),
    prisma.goal.count({
      where: {
        userId,
        status: 'completada',
        completedAt: { gte: from, lte: to },
      },
    }),
  ]);

  let averageProgress = 0;
  if (activeGoals.length > 0) {
    const totalProgress = activeGoals.reduce((acc, goal) => {
      if (goal.keyResults.length === 0) return acc;
      const goalProgress =
        goal.keyResults.reduce((sum, kr) => {
          const target = Number(kr.targetValue.toString());
          const current = Number(kr.currentValue.toString());
          if (target <= 0) return sum;
          return sum + Math.min(1, current / target);
        }, 0) / goal.keyResults.length;
      return acc + goalProgress;
    }, 0);
    averageProgress = Number((totalProgress / activeGoals.length).toFixed(4));
  }

  return {
    active: activeGoals.length,
    completedInPeriod,
    averageProgress,
  };
}

// ---------------------------------------------------------------------------
// Habit heatmap (US-143)
// ---------------------------------------------------------------------------

function formatDateUTC(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function bucketLevel(completions: number, max: number): HabitHeatmapLevel {
  if (max <= 0 || completions <= 0) return 0;
  const quarter = max / 4;
  if (completions <= quarter) return 1;
  if (completions <= quarter * 2) return 2;
  if (completions <= quarter * 3) return 3;
  return 4;
}

export async function getHabitHeatmap(userId: string, year: number): Promise<HabitHeatmap> {
  const startOfYear = new Date(Date.UTC(year, 0, 1, 12, 0, 0));
  const endOfYear = new Date(Date.UTC(year, 11, 31, 12, 0, 0));

  // Single grouped query: count completed records per date.
  const grouped = await prisma.habitRecord.groupBy({
    by: ['date'],
    where: {
      userId,
      completed: true,
      date: { gte: startOfYear, lte: endOfYear },
    },
    _count: { _all: true },
  });

  const byDate = new Map<string, number>();
  for (const row of grouped) {
    byDate.set(formatDateUTC(row.date), row._count._all);
  }

  // Walk every day of the year, filling zeros where there is no data.
  const days: HabitHeatmapDay[] = [];
  let totalCompletions = 0;
  let maxCompletions = 0;
  let bestDay: HabitHeatmapBestDay | null = null;

  const cursor = new Date(startOfYear);
  while (cursor.getUTCFullYear() === year) {
    const dateStr = formatDateUTC(cursor);
    const completions = byDate.get(dateStr) ?? 0;
    totalCompletions += completions;
    if (completions > maxCompletions) {
      maxCompletions = completions;
      bestDay = { date: dateStr, completions };
    }
    days.push({ date: dateStr, completions, level: 0 });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  // Apply dynamic bucketing for the level field.
  if (maxCompletions > 0) {
    for (const day of days) {
      day.level = bucketLevel(day.completions, maxCompletions);
    }
  }

  return {
    year,
    totalCompletions,
    bestDay,
    days,
  };
}

// ---------------------------------------------------------------------------
// Finance trends (US-144)
// ---------------------------------------------------------------------------

/**
 * Build the list of YYYY-MM month keys covering the last `months` months,
 * ending at (and including) the current month in UTC.
 */
function buildMonthKeys(months: number): string[] {
  const now = new Date();
  const keys: string[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    keys.push(`${y}-${m}`);
  }
  return keys;
}

function monthKeyFromDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * Compute the linear projection for the current month based on spend so far.
 * Returns null when the current month is not part of the requested range.
 */
function computeMonthProjection(
  monthKey: string,
  totalSoFar: number
): FinanceTrendsProjection | null {
  const now = new Date();
  const currentKey = monthKeyFromDate(now);
  if (monthKey !== currentKey) return null;

  const daysElapsed = now.getUTCDate();
  const daysInMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)
  ).getUTCDate();
  const projected = daysElapsed > 0 ? (totalSoFar / daysElapsed) * daysInMonth : 0;

  return {
    month: monthKey,
    projectedTotal: Number(projected.toFixed(2)),
    daysElapsed,
    daysInMonth,
  };
}

export async function getFinanceTrends(userId: string, months: number): Promise<FinanceTrends> {
  const monthKeys = buildMonthKeys(months);
  const [firstKey] = monthKeys;
  const [firstYear, firstMonth] = firstKey.split('-').map(Number);
  const rangeStart = new Date(Date.UTC(firstYear, firstMonth - 1, 1));
  // Inclusive end-of-current-month using day=0 trick for the next month.
  const now = new Date();
  const rangeEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59));

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      type: 'egreso',
      isTransfer: false,
      date: { gte: rangeStart, lte: rangeEnd },
    },
    select: {
      amount: true,
      date: true,
      categoryId: true,
      category: { select: { id: true, name: true, color: true } },
    },
  });

  // categoryId → { meta, byMonth: Map<monthKey, amount> }
  interface CategoryAgg {
    categoryName: string;
    color: string | null;
    byMonth: Map<string, number>;
    total: number;
  }
  const byCategory = new Map<string, CategoryAgg>();

  for (const tx of transactions) {
    const key = monthKeyFromDate(tx.date);
    const amount = Number(tx.amount.toString());
    let entry = byCategory.get(tx.categoryId);
    if (!entry) {
      entry = {
        categoryName: tx.category?.name ?? '(eliminada)',
        color: tx.category?.color ?? null,
        byMonth: new Map(),
        total: 0,
      };
      byCategory.set(tx.categoryId, entry);
    }
    entry.byMonth.set(key, (entry.byMonth.get(key) ?? 0) + amount);
    entry.total += amount;
  }

  // Build the response series — fill zeros for months without data.
  const series: FinanceTrendCategorySeries[] = Array.from(byCategory.entries())
    .map(([categoryId, agg]) => ({
      categoryId,
      categoryName: agg.categoryName,
      color: agg.color,
      points: monthKeys.map((month) => ({
        month,
        amount: Number((agg.byMonth.get(month) ?? 0).toFixed(2)),
      })),
      _total: agg.total,
    }))
    .sort((a, b) => b._total - a._total)
    .map(({ _total, ...rest }) => rest);

  // Projection of the current month (sum across all categories).
  const currentKey = monthKeyFromDate(now);
  let currentMonthTotal = 0;
  for (const agg of byCategory.values()) {
    currentMonthTotal += agg.byMonth.get(currentKey) ?? 0;
  }
  const projection = monthKeys.includes(currentKey)
    ? computeMonthProjection(currentKey, currentMonthTotal)
    : null;

  return {
    months: monthKeys,
    series,
    projection,
  };
}

// ---------------------------------------------------------------------------
// Productivity (US-145)
// ---------------------------------------------------------------------------

// TODO: replace with User.timezone once that field exists in the schema.
const PRODUCTIVITY_DEFAULT_TIMEZONE = 'America/Argentina/Buenos_Aires';

const WEEKDAY_INDEX: Record<string, DayOfWeekIndex> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

interface LocalParts {
  dayOfWeek: DayOfWeekIndex;
  hour: number;
}

function toLocalParts(date: Date, timeZone: string): LocalParts {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    hour: '2-digit',
    hour12: false,
  });
  let weekday = 'Sun';
  let hour = 0;
  for (const part of fmt.formatToParts(date)) {
    if (part.type === 'weekday') weekday = part.value;
    else if (part.type === 'hour') hour = Number(part.value);
  }
  return {
    dayOfWeek: WEEKDAY_INDEX[weekday] ?? 0,
    hour: Number.isFinite(hour) ? hour % 24 : 0,
  };
}

export function defaultProductivityRange(): { from: Date; to: Date } {
  const todayNoon = normalizeToUTCNoon(new Date());
  const from = new Date(todayNoon);
  from.setUTCDate(from.getUTCDate() - 89);
  return { from, to: todayNoon };
}

export function resolveProductivityRange(
  fromStr?: string,
  toStr?: string
): { from: Date; to: Date } {
  if (!fromStr && !toStr) {
    return defaultProductivityRange();
  }
  const todayNoon = normalizeToUTCNoon(new Date());
  const to = toStr ? parseISODateToNoonUTC(toStr) : todayNoon;
  const from = fromStr
    ? parseISODateToNoonUTC(fromStr)
    : (() => {
        const d = new Date(to);
        d.setUTCDate(d.getUTCDate() - 89);
        return d;
      })();
  return { from, to };
}

export async function getProductivity(
  userId: string,
  from: Date,
  to: Date,
  timeZone: string = PRODUCTIVITY_DEFAULT_TIMEZONE
): Promise<Productivity> {
  const completed = await prisma.task.findMany({
    where: {
      userId,
      status: 'completada',
      completedAt: { gte: from, lte: to },
    },
    select: { completedAt: true },
  });

  const dowCounts = new Map<DayOfWeekIndex, number>();
  const hourCounts = new Map<number, number>();
  const cellCounts = new Map<string, number>();

  for (const task of completed) {
    if (!task.completedAt) continue;
    const { dayOfWeek, hour } = toLocalParts(task.completedAt, timeZone);
    dowCounts.set(dayOfWeek, (dowCounts.get(dayOfWeek) ?? 0) + 1);
    hourCounts.set(hour, (hourCounts.get(hour) ?? 0) + 1);
    const cellKey = `${dayOfWeek}-${hour}`;
    cellCounts.set(cellKey, (cellCounts.get(cellKey) ?? 0) + 1);
  }

  // byDayOfWeek: always 7 entries.
  const byDayOfWeek: ProductivityDayOfWeek[] = [];
  for (let dow = 0; dow <= 6; dow++) {
    byDayOfWeek.push({
      dayOfWeek: dow as DayOfWeekIndex,
      completed: dowCounts.get(dow as DayOfWeekIndex) ?? 0,
    });
  }

  // byHourOfDay: only hours with completed > 0.
  const byHourOfDay: ProductivityHourOfDay[] = Array.from(hourCounts.entries())
    .map(([hour, c]) => ({ hour, completed: c }))
    .sort((a, b) => a.hour - b.hour);

  // heatmap: only cells with completed > 0.
  const heatmap: ProductivityHeatmapCell[] = Array.from(cellCounts.entries()).map(
    ([key, count]) => {
      const [dow, hour] = key.split('-').map(Number);
      return {
        dayOfWeek: dow as DayOfWeekIndex,
        hour,
        completed: count,
      };
    }
  );

  // bestDayOfWeek/bestHour: in ties, higher index wins (later in week / later in day).
  let bestDayOfWeek: ProductivityDayOfWeek | null = null;
  for (const entry of byDayOfWeek) {
    if (entry.completed === 0) continue;
    if (!bestDayOfWeek || entry.completed >= bestDayOfWeek.completed) {
      bestDayOfWeek = entry;
    }
  }

  let bestHour: ProductivityHourOfDay | null = null;
  for (const entry of byHourOfDay) {
    if (!bestHour || entry.completed >= bestHour.completed) {
      bestHour = entry;
    }
  }

  return {
    period: buildPeriod(from, to),
    totalCompleted: completed.length,
    byDayOfWeek,
    byHourOfDay,
    heatmap,
    bestDayOfWeek,
    bestHour,
  };
}

// ---------------------------------------------------------------------------
// Compare periods (US-146)
// ---------------------------------------------------------------------------

function computeDelta(current: number, previous: number): ComparisonValue {
  const delta = current - previous;
  const deltaPercentage = previous === 0 ? null : Number(((delta / previous) * 100).toFixed(2));
  return {
    current,
    previous,
    delta: Number(delta.toFixed(2)),
    deltaPercentage,
  };
}

type DomainSnapshot = {
  habits?: AnalyticsOverviewHabits;
  tasks?: AnalyticsOverviewTasks;
  finance?: AnalyticsOverviewFinance;
  workouts?: AnalyticsOverviewWorkouts;
};

async function loadDomainSnapshot(
  userId: string,
  from: Date,
  to: Date,
  domains: Set<'habits' | 'tasks' | 'finance' | 'workouts'>
): Promise<DomainSnapshot> {
  const tasks: Array<Promise<void>> = [];
  const snapshot: DomainSnapshot = {};

  if (domains.has('habits')) {
    tasks.push(
      getHabitsOverview(userId, from, to).then((r) => {
        snapshot.habits = r;
      })
    );
  }
  if (domains.has('tasks')) {
    tasks.push(
      getTasksOverview(userId, from, to).then((r) => {
        snapshot.tasks = r;
      })
    );
  }
  if (domains.has('finance')) {
    tasks.push(
      getFinanceOverview(userId, from, to).then((r) => {
        snapshot.finance = r;
      })
    );
  }
  if (domains.has('workouts')) {
    tasks.push(
      getWorkoutsOverview(userId, from, to).then((r) => {
        snapshot.workouts = r;
      })
    );
  }

  await Promise.all(tasks);
  return snapshot;
}

function dimensionsToDomains(
  dimensions: ComparableDimension[]
): Set<'habits' | 'tasks' | 'finance' | 'workouts'> {
  const domains = new Set<'habits' | 'tasks' | 'finance' | 'workouts'>();
  for (const dim of dimensions) {
    if (dim.startsWith('habits.')) domains.add('habits');
    else if (dim.startsWith('tasks.')) domains.add('tasks');
    else if (dim.startsWith('finance.')) domains.add('finance');
    else if (dim.startsWith('workouts.')) domains.add('workouts');
  }
  return domains;
}

function extractValue(dim: ComparableDimension, snapshot: DomainSnapshot): number {
  switch (dim) {
    case 'habits.completions':
      return snapshot.habits?.totalCompletions ?? 0;
    case 'tasks.completed':
      return snapshot.tasks?.completed ?? 0;
    case 'finance.expense':
      return snapshot.finance?.expense ?? 0;
    case 'finance.income':
      return snapshot.finance?.income ?? 0;
    case 'workouts.completed':
      return snapshot.workouts?.completed ?? 0;
  }
}

export async function comparePeriods(
  userId: string,
  current: { from: Date; to: Date },
  previous: { from: Date; to: Date },
  requested?: ComparableDimension[]
): Promise<PeriodComparison> {
  const dimensions: ComparableDimension[] = requested?.length
    ? requested
    : [...COMPARABLE_DIMENSIONS];

  const domains = dimensionsToDomains(dimensions);
  const [currentSnapshot, previousSnapshot] = await Promise.all([
    loadDomainSnapshot(userId, current.from, current.to, domains),
    loadDomainSnapshot(userId, previous.from, previous.to, domains),
  ]);

  const metrics = {} as ComparisonMetrics;
  for (const dim of dimensions) {
    metrics[dim] = computeDelta(
      extractValue(dim, currentSnapshot),
      extractValue(dim, previousSnapshot)
    );
  }

  return {
    current: buildPeriod(current.from, current.to),
    previous: buildPeriod(previous.from, previous.to),
    metrics,
  };
}

// ---------------------------------------------------------------------------
// Overview composition
// ---------------------------------------------------------------------------

export async function getOverview(
  userId: string,
  from: Date,
  to: Date
): Promise<AnalyticsOverview> {
  const [habits, tasks, finance, workouts, goals] = await Promise.all([
    getHabitsOverview(userId, from, to),
    getTasksOverview(userId, from, to),
    getFinanceOverview(userId, from, to),
    getWorkoutsOverview(userId, from, to),
    getGoalsOverview(userId, from, to),
  ]);

  return {
    period: buildPeriod(from, to),
    habits,
    tasks,
    finance,
    workouts,
    goals,
  };
}

export const analyticsService = {
  buildPeriod,
  defaultOverviewRange,
  resolveOverviewRange,
  getHabitsOverview,
  getTasksOverview,
  getFinanceOverview,
  getWorkoutsOverview,
  getGoalsOverview,
  getOverview,
  getHabitHeatmap,
  getFinanceTrends,
  getProductivity,
  defaultProductivityRange,
  resolveProductivityRange,
  comparePeriods,
};
