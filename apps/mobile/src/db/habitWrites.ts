import { Q } from '@nozbe/watermelondb';
import { database } from './index';
import { requestSync } from './syncScheduler';
import { Habit as HabitModel } from './models/Habit';
import { HabitRecord as HabitRecordModel } from './models/HabitRecord';
import { utcNoonMs, shouldCompleteOnDate } from './habitQueries';
import type { CreateHabitDTO, UpdateHabitDTO } from '@/services/api/habitApi';

/**
 * Escrituras locales del dominio Hábitos (offline-first Fase 2). Igual que
 * Dinero: batch atómico en SQLite → ajuste optimista de los derivados
 * (rachas) con la misma semántica que el server → requestSync() (push
 * debounced). El server recalcula las rachas desde los records en cada push
 * y el pull corrige cualquier diferencia.
 */

const habits = () => database.get<HabitModel>('habits');
const records = () => database.get<HabitRecordModel>('habit_records');

// ---------------------------------------------------------------------------
// Habits (CRUD)
// ---------------------------------------------------------------------------

export async function createHabitLocal(dto: CreateHabitDTO): Promise<void> {
  await database.write(async () => {
    await habits().create((h) => {
      h.categoryId = dto.categoryId;
      h.name = dto.name;
      h.description = dto.description;
      h.type = dto.type;
      h.targetValue = dto.targetValue;
      h.unit = dto.unit;
      h.periodicity = dto.periodicity;
      h.weekDays = dto.weekDays ?? [];
      h.timeOfDay = dto.timeOfDay || 'ANYTIME';
      h.color = dto.color;
      h.sortOrder = 0;
      h.isActive = true;
      h.currentStreak = 0;
      h.longestStreak = 0;
    });
  });
  requestSync();
}

export async function updateHabitLocal(id: string, dto: UpdateHabitDTO): Promise<void> {
  await database.write(async () => {
    const habit = await habits().find(id);
    await habit.update((h) => {
      if (dto.categoryId !== undefined) h.categoryId = dto.categoryId;
      if (dto.name !== undefined) h.name = dto.name;
      if (dto.description !== undefined) h.description = dto.description;
      if (dto.type !== undefined) h.type = dto.type;
      if (dto.targetValue !== undefined) h.targetValue = dto.targetValue;
      if (dto.unit !== undefined) h.unit = dto.unit;
      if (dto.periodicity !== undefined) h.periodicity = dto.periodicity;
      if (dto.weekDays !== undefined) h.weekDays = dto.weekDays;
      if (dto.timeOfDay !== undefined) h.timeOfDay = dto.timeOfDay;
      if (dto.color !== undefined) h.color = dto.color;
    });
  });
  requestSync();
}

/** Soft delete (igual que el REST): viaja como update con is_active=false. */
export async function deleteHabitLocal(id: string): Promise<void> {
  await database.write(async () => {
    const habit = await habits().find(id);
    await habit.update((h) => {
      h.isActive = false;
    });
  });
  requestSync();
}

// ---------------------------------------------------------------------------
// Records (toggle / valor numérico)
// ---------------------------------------------------------------------------

/** Día programado anterior a `noon` (hasta 30 días atrás, como el backend). */
function previousScheduledNoon(habit: HabitModel, noon: number): number | null {
  const createdNoon = utcNoonMs(habit.createdAt.toISOString().slice(0, 10));
  for (let i = 1; i <= 30; i++) {
    const check = noon - i * 24 * 60 * 60 * 1000;
    if (check < createdNoon) return null;
    if (shouldCompleteOnDate(habit, check)) return check;
  }
  return null;
}

/**
 * Upsert del registro del día + ajuste optimista de racha (espejo de
 * `actualizarRacha` del backend para el caso común: marcar/desmarcar hoy).
 */
export async function setHabitRecordLocal(params: {
  habitId: string;
  date: string; // 'yyyy-MM-dd'
  completed: boolean;
  value?: number;
}): Promise<void> {
  const { habitId, date, completed, value } = params;
  const noon = utcNoonMs(date);

  await database.write(async () => {
    const habit = await habits().find(habitId);
    const recordValue = habit.type === 'NUMERIC' ? value : undefined;

    const existing = await records()
      .query(Q.where('habit_id', habitId), Q.where('date', noon))
      .fetch();

    if (existing.length > 0) {
      await existing[0].update((r) => {
        r.completed = completed;
        r.value = recordValue;
      });
    } else {
      await records().create((r) => {
        r.habitId = habitId;
        r.date = new Date(noon);
        r.completed = completed;
        r.value = recordValue;
      });
    }

    // Racha optimista (el server recalcula en el push y el pull corrige)
    await habit.update((h) => {
      if (completed) {
        const last = h.lastCompletedDate?.getTime();
        if (last !== noon) {
          const prevScheduled = previousScheduledNoon(habit, noon);
          h.currentStreak =
            prevScheduled !== null && last === prevScheduled ? h.currentStreak + 1 : 1;
        }
        if (h.currentStreak > h.longestStreak) h.longestStreak = h.currentStreak;
        h.lastCompletedDate = new Date(noon);
      } else {
        h.currentStreak = 0;
        // lastCompletedDate queda como está (mismo comportamiento del server)
      }
    });
  });
  requestSync();
}
