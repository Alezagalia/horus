import { Q } from '@nozbe/watermelondb';
import { database } from './index';
import { Habit as HabitModel } from './models/Habit';
import { HabitRecord as HabitRecordModel } from './models/HabitRecord';
import { Category as CategoryModel } from './models/Category';
import type { Habit, HabitRecord, HabitStats } from '@/services/api/habitApi';

/**
 * Lecturas locales del dominio Hábitos (offline-first Fase 2). Mismo contrato
 * que la API REST (`GET /habits`, `GET /habits/stats`) para que los hooks no
 * cambien su interfaz con las pantallas.
 */

const habits = () => database.get<HabitModel>('habits');
const records = () => database.get<HabitRecordModel>('habit_records');
const categories = () => database.get<CategoryModel>('categories');

/** Fecha 'yyyy-MM-dd' → ms del mediodía UTC (misma normalización que el
 * backend para columnas @db.Date: igualdad exacta por día). */
export function utcNoonMs(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  return Date.UTC(y, m - 1, d, 12, 0, 0, 0);
}

/**
 * ¿El hábito estaba programado para esa fecha? Espejo de
 * `debiaRealizarseEnFecha` del backend (streak.service.ts). Trabaja en UTC
 * sobre fechas normalizadas a mediodía UTC.
 */
export function shouldCompleteOnDate(
  habit: { periodicity: string; weekDays: number[]; createdAt: Date },
  noonUtcMs: number
): boolean {
  const date = new Date(noonUtcMs);
  const dayOfWeek = date.getUTCDay();

  switch (habit.periodicity) {
    case 'DAILY':
    case 'CUSTOM':
      return habit.weekDays.length > 0 ? habit.weekDays.includes(dayOfWeek) : true;
    case 'WEEKLY':
      return habit.weekDays.includes(dayOfWeek);
    case 'MONTHLY':
      return date.getUTCDate() === habit.createdAt.getUTCDate();
    default:
      return false;
  }
}

function toApiHabit(
  h: HabitModel,
  category: CategoryModel | undefined,
  record: HabitRecordModel | undefined,
  forDate: string | undefined
): Habit {
  return {
    id: h.id,
    name: h.name,
    description: h.description ?? undefined,
    type: h.type as Habit['type'],
    targetValue: h.targetValue ?? undefined,
    unit: h.unit ?? undefined,
    periodicity: h.periodicity as Habit['periodicity'],
    weekDays: h.weekDays,
    timeOfDay: h.timeOfDay,
    color: h.color ?? undefined,
    isActive: h.isActive,
    currentStreak: h.currentStreak,
    longestStreak: h.longestStreak,
    lastCompletedDate: h.lastCompletedDate ? h.lastCompletedDate.toISOString() : undefined,
    category: category
      ? {
          id: category.id,
          name: category.name,
          icon: category.icon ?? '',
          color: category.color ?? '',
        }
      : undefined,
    records: record
      ? [
          {
            id: record.id,
            habitId: h.id,
            completed: record.completed,
            value: record.value ?? null,
            notes: record.notes ?? null,
          } satisfies HabitRecord,
        ]
      : // Distingue "sin registro ese día" ([]) de "no se pidió por fecha"
        forDate !== undefined
        ? []
        : undefined,
  };
}

/** GET /habits(?date=) — hábitos activos; con `date` embebe el record del día. */
export async function listHabitsLocal(forDate?: string): Promise<Habit[]> {
  const rows = await habits().query(Q.where('is_active', true)).fetch();
  // Orden REST: `order` asc, luego createdAt asc
  rows.sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.getTime() - b.createdAt.getTime());

  const categoryRows = await categories().query().fetch();
  const categoryById = new Map(categoryRows.map((c) => [c.id, c]));

  let recordByHabit = new Map<string, HabitRecordModel>();
  if (forDate) {
    const dayRecords = await records()
      .query(Q.where('date', utcNoonMs(forDate)))
      .fetch();
    recordByHabit = new Map(dayRecords.map((r) => [r.habitId, r]));
  }

  return rows.map((h) =>
    toApiHabit(h, categoryById.get(h.categoryId), recordByHabit.get(h.id), forDate)
  );
}

/** GET /habits/stats (shape ya mapeado de habitApi.getStats): stats de HOY. */
export async function getHabitStatsLocal(todayStr: string): Promise<HabitStats> {
  const rows = await habits().query(Q.where('is_active', true)).fetch();
  const noon = utcNoonMs(todayStr);

  const dueToday = rows.filter((h) => shouldCompleteOnDate(h, noon));
  const dayRecords = await records().query(Q.where('date', noon)).fetch();
  const completedIds = new Set(dayRecords.filter((r) => r.completed).map((r) => r.habitId));
  const completed = dueToday.filter((h) => completedIds.has(h.id)).length;

  let currentBest = 0;
  let longestEver = 0;
  for (const h of rows) {
    if (h.currentStreak > currentBest) currentBest = h.currentStreak;
    if (h.longestStreak > longestEver) longestEver = h.longestStreak;
  }

  return {
    today: {
      total: dueToday.length,
      completed,
      percentage: dueToday.length > 0 ? completed / dueToday.length : 0,
    },
    streaks: { currentBest, longestEver },
  };
}
