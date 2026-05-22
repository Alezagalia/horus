/**
 * Timeline Service — milestone engine
 * F-16 - Arqueología Personal
 * Sprint 16 - US-152
 *
 * Computes timeline events on-the-fly across all user domains:
 * - first.*       — first time something happened (first habit, first workout, etc.)
 * - completed.*   — closure milestones (goal completed, streak reached)
 * - anniversary.* — exact-day anniversaries of primary events (1m, 3m, 6m, 1y...)
 * - milestone.*   — round-number accumulated counts (100 tasks, 50 workouts)
 */

import {
  TIMELINE_CATEGORIES,
  TIMELINE_MODULES,
  type TimelineEvent,
  type TimelineEventCategory,
  type TimelineModule,
  type TimelineResponse,
} from '@horus/shared';
import { prisma } from '../lib/prisma.js';
import { formatDateString, parseISODateToNoonUTC } from '../utils/date.utils.js';

interface TimelineFilters {
  from?: Date;
  to: Date;
  modules: Set<TimelineModule>;
  categories: Set<TimelineEventCategory>;
  limit: number;
  offset: number;
}

interface TimelineQueryInput {
  from?: string;
  to?: string;
  modules?: TimelineModule[];
  categories?: TimelineEventCategory[];
  limit?: number;
  offset?: number;
}

function resolveFilters(query: TimelineQueryInput): TimelineFilters {
  const to = query.to ? parseISODateToNoonUTC(query.to) : new Date();
  return {
    from: query.from ? parseISODateToNoonUTC(query.from) : undefined,
    to,
    modules: new Set(query.modules?.length ? query.modules : TIMELINE_MODULES),
    categories: new Set(query.categories?.length ? query.categories : TIMELINE_CATEGORIES),
    limit: query.limit ?? 100,
    offset: query.offset ?? 0,
  };
}

const today = (filters: TimelineFilters): string => formatDateString(filters.to);

// ---------------------------------------------------------------------------
// first.* detectors
// ---------------------------------------------------------------------------

async function detectFirstHabit(userId: string): Promise<TimelineEvent | null> {
  const first = await prisma.habit.findFirst({
    where: { userId },
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true, createdAt: true },
  });
  if (!first) return null;
  return {
    id: `first.habit.created.${first.id}`,
    module: 'habits',
    category: 'first',
    kind: 'habit.created',
    date: formatDateString(first.createdAt),
    title: `Tu primer hábito: ${first.name}`,
    entity: { type: 'habits', id: first.id, name: first.name },
  };
}

async function detectFirstTask(userId: string): Promise<TimelineEvent | null> {
  const first = await prisma.task.findFirst({
    where: { userId },
    orderBy: { createdAt: 'asc' },
    select: { id: true, title: true, createdAt: true },
  });
  if (!first) return null;
  return {
    id: `first.task.created.${first.id}`,
    module: 'tasks',
    category: 'first',
    kind: 'task.created',
    date: formatDateString(first.createdAt),
    title: `Tu primera tarea: ${first.title}`,
    entity: { type: 'tasks', id: first.id, name: first.title },
  };
}

async function detectFirstTaskCompleted(userId: string): Promise<TimelineEvent | null> {
  const first = await prisma.task.findFirst({
    where: { userId, status: 'completada', completedAt: { not: null } },
    orderBy: { completedAt: 'asc' },
    select: { id: true, title: true, completedAt: true },
  });
  if (!first?.completedAt) return null;
  return {
    id: `first.task.completed.${first.id}`,
    module: 'tasks',
    category: 'first',
    kind: 'task.completed',
    date: formatDateString(first.completedAt),
    title: `Tu primera tarea completada: ${first.title}`,
    entity: { type: 'tasks', id: first.id, name: first.title },
  };
}

async function detectFirstWorkout(userId: string): Promise<TimelineEvent | null> {
  const first = await prisma.workout.findFirst({
    where: { userId, endTime: { not: null } },
    orderBy: { endTime: 'asc' },
    select: { id: true, endTime: true },
  });
  if (!first?.endTime) return null;
  return {
    id: `first.workout.first.${first.id}`,
    module: 'workouts',
    category: 'first',
    kind: 'workout.first',
    date: formatDateString(first.endTime),
    title: 'Tu primer entrenamiento',
    description: 'Empezaste a llevar el registro de tus workouts.',
    entity: { type: 'workouts', id: first.id },
  };
}

async function detectFirstGoal(userId: string): Promise<TimelineEvent | null> {
  const first = await prisma.goal.findFirst({
    where: { userId },
    orderBy: { createdAt: 'asc' },
    select: { id: true, title: true, createdAt: true },
  });
  if (!first) return null;
  return {
    id: `first.goal.created.${first.id}`,
    module: 'goals',
    category: 'first',
    kind: 'goal.created',
    date: formatDateString(first.createdAt),
    title: `Tu primera meta: ${first.title}`,
    entity: { type: 'goals', id: first.id, name: first.title },
  };
}

async function detectFirstAccount(userId: string): Promise<TimelineEvent | null> {
  const first = await prisma.account.findFirst({
    where: { userId },
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true, createdAt: true },
  });
  if (!first) return null;
  return {
    id: `first.account.created.${first.id}`,
    module: 'finance',
    category: 'first',
    kind: 'account.created',
    date: formatDateString(first.createdAt),
    title: `Creaste tu primera cuenta: ${first.name}`,
    entity: { type: 'finance', id: first.id, name: first.name },
  };
}

async function detectFirstTransaction(userId: string): Promise<TimelineEvent | null> {
  const first = await prisma.transaction.findFirst({
    where: { userId, isTransfer: false },
    orderBy: { date: 'asc' },
    select: { id: true, concept: true, date: true },
  });
  if (!first) return null;
  return {
    id: `first.transaction.first.${first.id}`,
    module: 'finance',
    category: 'first',
    kind: 'transaction.first',
    date: formatDateString(first.date),
    title: `Tu primer movimiento financiero: ${first.concept}`,
    entity: { type: 'finance', id: first.id, name: first.concept },
  };
}

async function detectFirstResource(userId: string): Promise<TimelineEvent | null> {
  const first = await prisma.resource.findFirst({
    where: { userId },
    orderBy: { createdAt: 'asc' },
    select: { id: true, title: true, createdAt: true },
  });
  if (!first) return null;
  return {
    id: `first.resource.created.${first.id}`,
    module: 'resources',
    category: 'first',
    kind: 'resource.created',
    date: formatDateString(first.createdAt),
    title: `Tu primer recurso: ${first.title}`,
    entity: { type: 'resources', id: first.id, name: first.title },
  };
}

async function detectFirstEvents(
  userId: string,
  filters: TimelineFilters
): Promise<TimelineEvent[]> {
  const tasks: Array<Promise<TimelineEvent | null>> = [];
  if (filters.modules.has('habits')) tasks.push(detectFirstHabit(userId));
  if (filters.modules.has('tasks')) {
    tasks.push(detectFirstTask(userId));
    tasks.push(detectFirstTaskCompleted(userId));
  }
  if (filters.modules.has('workouts')) tasks.push(detectFirstWorkout(userId));
  if (filters.modules.has('goals')) tasks.push(detectFirstGoal(userId));
  if (filters.modules.has('finance')) {
    tasks.push(detectFirstAccount(userId));
    tasks.push(detectFirstTransaction(userId));
  }
  if (filters.modules.has('resources')) tasks.push(detectFirstResource(userId));

  const results = await Promise.all(tasks);
  return results.filter((e): e is TimelineEvent => e !== null);
}

// ---------------------------------------------------------------------------
// completed.* detectors
// ---------------------------------------------------------------------------

async function detectCompletedGoals(userId: string): Promise<TimelineEvent[]> {
  const goals = await prisma.goal.findMany({
    where: { userId, status: 'completada', completedAt: { not: null } },
    orderBy: { completedAt: 'desc' },
    select: { id: true, title: true, completedAt: true },
  });
  return goals
    .filter((g) => g.completedAt !== null)
    .map((g) => ({
      id: `completed.goal.${g.id}`,
      module: 'goals' as const,
      category: 'completed' as const,
      kind: 'goal.completed',
      date: formatDateString(g.completedAt as Date),
      title: `Completaste la meta: ${g.title}`,
      entity: { type: 'goals' as const, id: g.id, name: g.title },
    }));
}

const STREAK_THRESHOLDS = [30, 60, 90] as const;

async function detectStreakMilestones(userId: string): Promise<TimelineEvent[]> {
  const habits = await prisma.habit.findMany({
    where: { userId, longestStreak: { gte: STREAK_THRESHOLDS[0] } },
    select: { id: true, name: true, longestStreak: true, lastCompletedDate: true },
  });

  const events: TimelineEvent[] = [];
  for (const habit of habits) {
    const eventDate = habit.lastCompletedDate ?? new Date();
    for (const threshold of STREAK_THRESHOLDS) {
      if (habit.longestStreak >= threshold) {
        events.push({
          id: `completed.habit.streak.${threshold}.${habit.id}`,
          module: 'habits',
          category: 'completed',
          kind: `habit.streak.${threshold}`,
          date: formatDateString(eventDate),
          title: `${threshold} días de racha en ${habit.name}`,
          description: `Alcanzaste una racha de ${threshold}+ días.`,
          entity: { type: 'habits', id: habit.id, name: habit.name },
        });
      }
    }
  }
  return events;
}

async function detectCompletedEvents(
  userId: string,
  filters: TimelineFilters
): Promise<TimelineEvent[]> {
  const tasks: Array<Promise<TimelineEvent[]>> = [];
  if (filters.modules.has('goals')) tasks.push(detectCompletedGoals(userId));
  if (filters.modules.has('habits')) tasks.push(detectStreakMilestones(userId));

  const results = await Promise.all(tasks);
  return results.flat();
}

// ---------------------------------------------------------------------------
// milestone.* detectors (Nth element to find crossing date)
// ---------------------------------------------------------------------------

const TASK_THRESHOLDS = [100, 500, 1000] as const;
const HABIT_COMPLETION_THRESHOLDS = [500, 1000, 5000] as const;
const WORKOUT_THRESHOLDS = [10, 50, 100] as const;

async function detectTaskMilestones(userId: string): Promise<TimelineEvent[]> {
  const events: TimelineEvent[] = [];
  for (const threshold of TASK_THRESHOLDS) {
    const nth = await prisma.task.findFirst({
      where: { userId, status: 'completada', completedAt: { not: null } },
      orderBy: { completedAt: 'asc' },
      skip: threshold - 1,
      select: { completedAt: true },
    });
    if (nth?.completedAt) {
      events.push({
        id: `milestone.tasks.${threshold}`,
        module: 'tasks',
        category: 'milestone',
        kind: `tasks.${threshold}`,
        date: formatDateString(nth.completedAt),
        title: `${threshold.toLocaleString('es-AR')} tareas completadas`,
      });
    } else {
      break; // crossing not reached yet — higher thresholds won't be either
    }
  }
  return events;
}

async function detectHabitCompletionMilestones(userId: string): Promise<TimelineEvent[]> {
  const events: TimelineEvent[] = [];
  for (const threshold of HABIT_COMPLETION_THRESHOLDS) {
    const nth = await prisma.habitRecord.findFirst({
      where: { userId, completed: true },
      orderBy: { date: 'asc' },
      skip: threshold - 1,
      select: { date: true },
    });
    if (nth) {
      events.push({
        id: `milestone.habits.completions.${threshold}`,
        module: 'habits',
        category: 'milestone',
        kind: `habits.completions.${threshold}`,
        date: formatDateString(nth.date),
        title: `${threshold.toLocaleString('es-AR')} hábitos cumplidos en total`,
      });
    } else {
      break;
    }
  }
  return events;
}

async function detectWorkoutMilestones(userId: string): Promise<TimelineEvent[]> {
  const events: TimelineEvent[] = [];
  for (const threshold of WORKOUT_THRESHOLDS) {
    const nth = await prisma.workout.findFirst({
      where: { userId, endTime: { not: null } },
      orderBy: { endTime: 'asc' },
      skip: threshold - 1,
      select: { endTime: true },
    });
    if (nth?.endTime) {
      events.push({
        id: `milestone.workouts.${threshold}`,
        module: 'workouts',
        category: 'milestone',
        kind: `workouts.${threshold}`,
        date: formatDateString(nth.endTime),
        title: `${threshold} workouts completados`,
      });
    } else {
      break;
    }
  }
  return events;
}

async function detectMilestones(
  userId: string,
  filters: TimelineFilters
): Promise<TimelineEvent[]> {
  const tasks: Array<Promise<TimelineEvent[]>> = [];
  if (filters.modules.has('tasks')) tasks.push(detectTaskMilestones(userId));
  if (filters.modules.has('habits')) tasks.push(detectHabitCompletionMilestones(userId));
  if (filters.modules.has('workouts')) tasks.push(detectWorkoutMilestones(userId));

  const results = await Promise.all(tasks);
  return results.flat();
}

// ---------------------------------------------------------------------------
// anniversary.* generator (derived from first.* + completed.* events)
// ---------------------------------------------------------------------------

function parseDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

interface AnniversaryMatch {
  yearsAgo?: number;
  monthsAgo?: number;
}

const ANNIVERSARY_YEARS = [1, 2, 3, 4, 5, 10, 15, 20];
const ANNIVERSARY_MONTHS = [1, 3, 6];

/**
 * Returns an AnniversaryMatch when `eventDate` falls on an exact 1m/3m/6m or
 * 1y+/Ny boundary relative to `today`.
 */
function checkAnniversary(eventDate: Date, today: Date): AnniversaryMatch | null {
  // Same month and day?
  if (
    eventDate.getUTCMonth() === today.getUTCMonth() &&
    eventDate.getUTCDate() === today.getUTCDate()
  ) {
    const yearsAgo = today.getUTCFullYear() - eventDate.getUTCFullYear();
    if (yearsAgo > 0 && ANNIVERSARY_YEARS.includes(yearsAgo)) {
      return { yearsAgo };
    }
  }

  // Same day of the month, N months ago?
  if (eventDate.getUTCDate() === today.getUTCDate()) {
    const monthsAgo =
      (today.getUTCFullYear() - eventDate.getUTCFullYear()) * 12 +
      (today.getUTCMonth() - eventDate.getUTCMonth());
    if (monthsAgo > 0 && ANNIVERSARY_MONTHS.includes(monthsAgo)) {
      return { monthsAgo };
    }
  }

  return null;
}

function anniversaryTitle(original: TimelineEvent, match: AnniversaryMatch): string {
  const ago = match.yearsAgo
    ? `${match.yearsAgo} año${match.yearsAgo === 1 ? '' : 's'}`
    : `${match.monthsAgo} mes${match.monthsAgo === 1 ? '' : 'es'}`;
  // Reword the original title slightly: prepend "Hace X · "
  return `Hace ${ago} · ${original.title}`;
}

function generateAnniversaries(primaryEvents: TimelineEvent[], todayDate: Date): TimelineEvent[] {
  const annivs: TimelineEvent[] = [];
  for (const event of primaryEvents) {
    // Only generate anniversaries from `first` and `completed` events.
    if (event.category !== 'first' && event.category !== 'completed') continue;
    const eventDate = parseDate(event.date);
    const match = checkAnniversary(eventDate, todayDate);
    if (!match) continue;
    annivs.push({
      id: `anniversary.${event.kind}.${event.entity?.id ?? event.id}`,
      module: event.module,
      category: 'anniversary',
      kind: event.kind,
      date: formatDateString(todayDate),
      title: anniversaryTitle(event, match),
      description: 'Aniversario.',
      entity: event.entity,
      anniversary: match,
    });
  }
  return annivs;
}

// ---------------------------------------------------------------------------
// Compose
// ---------------------------------------------------------------------------

function withinRange(event: TimelineEvent, filters: TimelineFilters): boolean {
  const date = parseDate(event.date);
  if (filters.from && date.getTime() < filters.from.getTime()) return false;
  if (date.getTime() > filters.to.getTime()) return false;
  return true;
}

export async function getTimeline(
  userId: string,
  query: TimelineQueryInput
): Promise<TimelineResponse> {
  const filters = resolveFilters(query);

  const [firsts, completed, milestones] = await Promise.all([
    detectFirstEvents(userId, filters),
    detectCompletedEvents(userId, filters),
    detectMilestones(userId, filters),
  ]);

  const primary = [...firsts, ...completed];
  const anniversaries = generateAnniversaries(primary, filters.to);

  let all: TimelineEvent[] = [...primary, ...milestones, ...anniversaries];

  // Filter by category set if the caller restricted it.
  if (filters.categories.size < TIMELINE_CATEGORIES.length) {
    all = all.filter((e) => filters.categories.has(e.category));
  }

  // Filter by date range.
  all = all.filter((e) => withinRange(e, filters));

  // Descending by date.
  all.sort((a, b) => (b.date < a.date ? -1 : b.date > a.date ? 1 : 0));

  const total = all.length;
  const paged = all.slice(filters.offset, filters.offset + filters.limit);

  return {
    events: paged,
    total,
    hasMore: filters.offset + filters.limit < total,
  };
}

export const timelineService = {
  getTimeline,
};

// Expose helpers for testing
export const __test = {
  checkAnniversary,
  generateAnniversaries,
  resolveFilters,
  today,
};
