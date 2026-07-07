import { HabitRecord } from '../../../generated/prisma/client.js';
import { logger } from '../../../lib/logger.js';
import { normalizeToUTCNoon } from '../../../utils/date.utils.js';
import { debiaRealizarseEnFecha } from '../../streak.service.js';
import { PushContext } from '../push-context.js';
import { HabitRecordRaw } from '../types.js';

export function toRaw(r: HabitRecord): HabitRecordRaw {
  return {
    id: r.id,
    habit_id: r.habitId,
    date: r.date.getTime(),
    completed: r.completed,
    value: r.value,
    notes: r.notes,
    created_at: r.createdAt.getTime(),
    updated_at: r.updatedAt.getTime(),
  };
}

/**
 * Aplica un batch de records entrantes (created y updated comparten lógica:
 * el record es un upsert por (habitId, userId, date), igual que el REST).
 *
 * Side-effects que el REST dispara y acá se preservan:
 *  - KR auto-increment: SOLO en la transición no-completado → completado
 *    (el REST incrementa en cada POST completed=true; acá sería double-count
 *    porque Watermelon reintenta pushes).
 *  - Racha: se recalcula desde los records al final del batch (una vez por
 *    hábito afectado), en la misma transacción.
 */
async function applyRecords(ctx: PushContext, raws: HabitRecordRaw[]): Promise<Set<string>> {
  const affectedHabitIds = new Set<string>();

  for (const raw of raws) {
    const habit = await ctx.tx.habit.findUnique({ where: { id: raw.habit_id } });
    if (!habit || habit.userId !== ctx.userId) {
      logger.warn(`[replication] habit_record ${raw.id} de hábito ajeno/inexistente: ignorado`);
      continue;
    }

    const date = normalizeToUTCNoon(new Date(raw.date));
    const completed = raw.completed ?? false;
    const value = habit.type === 'NUMERIC' ? raw.value : null;

    // Upsert por clave compuesta: si el mismo día ya tiene un record creado por
    // otra vía (web) con otro id, se actualiza ESA fila (LWW client-wins) y el
    // id del cliente queda huérfano — el pull le baja la fila del server.
    const existing = await ctx.tx.habitRecord.findUnique({
      where: { habitId_userId_date: { habitId: habit.id, userId: ctx.userId, date } },
    });

    const wasCompleted = existing?.completed ?? false;

    if (existing) {
      if (existing.id !== raw.id) {
        logger.warn(
          `[replication] habit_record ${raw.id} colisiona con ${existing.id} (mismo hábito/fecha): se actualiza el existente`
        );
      }
      await ctx.tx.habitRecord.update({
        where: { id: existing.id },
        data: { completed, value, notes: raw.notes },
      });
    } else {
      await ctx.tx.habitRecord.create({
        data: {
          id: raw.id,
          habitId: habit.id,
          userId: ctx.userId,
          date,
          completed,
          value,
          notes: raw.notes,
        },
      });
    }

    // KR auto-increment solo cuando el record pasa a completado
    if (completed && !wasCompleted) {
      const links = await ctx.tx.goalHabit.findMany({
        where: { habitId: habit.id, krId: { not: null } },
        include: { goal: { select: { userId: true } } },
      });
      for (const link of links) {
        if (link.goal.userId !== ctx.userId || !link.krId) continue;
        const increment = habit.type === 'NUMERIC' ? (value ?? 1) : 1;
        await ctx.tx.keyResult.update({
          where: { id: link.krId },
          data: { currentValue: { increment } },
        });
      }
    }

    affectedHabitIds.add(habit.id);
  }

  return affectedHabitIds;
}

/** Tope de días a recorrer al recalcular rachas (~10 años). */
const MAX_STREAK_SCAN_DAYS = 3650;

/**
 * Recalcula currentStreak/longestStreak/lastCompletedDate de un hábito a partir
 * de sus records, dentro de la transacción del push. Espeja la semántica de
 * `actualizarRacha`: un día programado SIN record no rompe la racha de hoy
 * (todavía "pendiente"), pero un record explícito completed=false sí.
 */
export async function recalcStreak(ctx: PushContext, habitId: string): Promise<void> {
  const habit = await ctx.tx.habit.findUnique({ where: { id: habitId } });
  if (!habit || habit.userId !== ctx.userId) return;

  const records = await ctx.tx.habitRecord.findMany({
    where: { habitId, userId: ctx.userId },
    select: { date: true, completed: true },
  });

  const byDay = new Map<number, boolean>();
  let lastCompletedDate: Date | null = null;
  for (const r of records) {
    const day = normalizeToUTCNoon(r.date);
    byDay.set(day.getTime(), r.completed);
    if (r.completed && (!lastCompletedDate || day > lastCompletedDate)) {
      lastCompletedDate = day;
    }
  }

  const today = normalizeToUTCNoon(new Date());
  const createdAt = normalizeToUTCNoon(habit.createdAt);

  // currentStreak: desde hoy hacia atrás sobre los días programados.
  let currentStreak = 0;
  let pendingToday = true; // hoy sin record no rompe la racha
  const cursor = new Date(today);
  for (let i = 0; i < MAX_STREAK_SCAN_DAYS && cursor >= createdAt; i++) {
    if (debiaRealizarseEnFecha(habit, cursor)) {
      const completed = byDay.get(cursor.getTime());
      if (completed === true) {
        currentStreak++;
      } else if (completed === undefined && pendingToday) {
        // día de hoy todavía sin marcar: la racha sigue viva desde ayer
      } else {
        break;
      }
      pendingToday = false;
    }
    cursor.setDate(cursor.getDate() - 1);
  }

  // longestStreak: mejor secuencia histórica (día programado sin completar corta)
  let longestStreak = 0;
  let tempStreak = 0;
  const scan = new Date(today);
  for (let i = 0; i < MAX_STREAK_SCAN_DAYS && scan >= createdAt; i++) {
    if (debiaRealizarseEnFecha(habit, scan)) {
      if (byDay.get(scan.getTime()) === true) {
        tempStreak++;
        if (tempStreak > longestStreak) longestStreak = tempStreak;
      } else {
        tempStreak = 0;
      }
    }
    scan.setDate(scan.getDate() - 1);
  }

  await ctx.tx.habit.update({
    where: { id: habitId },
    data: {
      currentStreak,
      longestStreak: Math.max(longestStreak, habit.longestStreak),
      lastCompletedDate,
    },
  });
}

export async function applyCreated(ctx: PushContext, raws: HabitRecordRaw[]): Promise<Set<string>> {
  return applyRecords(ctx, raws);
}

export async function applyUpdated(ctx: PushContext, raws: HabitRecordRaw[]): Promise<Set<string>> {
  return applyRecords(ctx, raws);
}
