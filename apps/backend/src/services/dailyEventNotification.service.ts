/**
 * Daily Event Notification Service
 *
 * Envía push automáticos (uno por categoría) con el resumen del día para cada
 * usuario que tenga al menos un token de push activo:
 *   - Hábitos pendientes de hoy
 *   - Tareas que vencen hoy
 *   - Gastos fijos pendientes del mes
 *
 * Cada envío se persiste en la tabla Notification (sirve de registro y de
 * deduplicación: no se reenvía la misma categoría dos veces el mismo día).
 *
 * Zona horaria de referencia: Argentina (UTC-3). El job que lo dispara corre a
 * las 08:00 ART (ver notify-daily-events.job.ts).
 */

import { prisma } from '../lib/prisma.js';
import { sendToUser } from './push/push-notification.service.js';
import { getMonthlyExpenses } from './monthlyExpense.service.js';
import { parseISODateToNoonUTC } from '../utils/date.utils.js';

const TZ = 'America/Argentina/Buenos_Aires';

interface CategoryPush {
  /** Notification.type — también usado para deduplicar por día */
  type: string;
  /** data.screen para el deep-link al tocar la notificación en mobile */
  screen: string;
  title: string;
  body: string;
}

/** Devuelve la fecha "hoy" en Argentina como partes y string YYYY-MM-DD. */
function getArgToday(): { todayStr: string; month: number; year: number } {
  // 'en-CA' formatea como YYYY-MM-DD
  const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date());
  const [year, month] = todayStr.split('-').map(Number);
  return { todayStr, month, year };
}

/** Espejo de la validación de periodicidad del backend/mobile. */
function isHabitDueToday(h: { periodicity: string; weekDays: number[] }, dow: number): boolean {
  if (h.periodicity === 'MONTHLY') return true;
  if (h.periodicity === 'WEEKLY') return h.weekDays.includes(dow);
  if (h.weekDays.length > 0) return h.weekDays.includes(dow);
  return true;
}

/** Hábitos que corresponden a hoy y siguen sin completar. */
async function countHabitsPending(
  userId: string,
  todayNoonUTC: Date,
  dow: number
): Promise<number> {
  const habits = await prisma.habit.findMany({
    where: { userId, isActive: true },
    select: { id: true, periodicity: true, weekDays: true },
  });

  const dueIds = habits.filter((h) => isHabitDueToday(h, dow)).map((h) => h.id);
  if (dueIds.length === 0) return 0;

  const completed = await prisma.habitRecord.findMany({
    where: { userId, date: todayNoonUTC, habitId: { in: dueIds }, completed: true },
    select: { habitId: true },
  });
  const completedSet = new Set(completed.map((r) => r.habitId));

  return dueIds.filter((id) => !completedSet.has(id)).length;
}

/** Tareas activas, no terminadas, cuyo dueDate cae en el día de hoy (ART). */
async function countTasksDueToday(userId: string, todayStr: string): Promise<number> {
  const start = new Date(`${todayStr}T00:00:00-03:00`);
  const end = new Date(`${todayStr}T23:59:59.999-03:00`);

  return prisma.task.count({
    where: {
      userId,
      isActive: true,
      status: { in: ['pendiente', 'en_progreso'] },
      dueDate: { gte: start, lte: end },
    },
  });
}

/** Gastos fijos del mes en estado pendiente. */
async function countExpensesPending(userId: string, month: number, year: number): Promise<number> {
  const list = await getMonthlyExpenses(userId, month, year);
  return list.filter((e) => e.status === 'pendiente').length;
}

/**
 * Recorre todos los usuarios con tokens activos y envía un push por cada
 * categoría que tenga elementos pendientes. Idempotente por día gracias al
 * registro en Notification.
 */
export async function notifyDailyEvents(): Promise<{ usersNotified: number; pushesSent: number }> {
  const { todayStr, month, year } = getArgToday();
  const todayNoonUTC = parseISODateToNoonUTC(todayStr);
  const dow = todayNoonUTC.getUTCDay(); // día de la semana de hoy (ART)
  const startOfArgDay = new Date(`${todayStr}T00:00:00-03:00`);

  // Usuarios con al menos un token de push activo
  const tokenUsers = await prisma.pushToken.findMany({
    where: { active: true },
    distinct: ['userId'],
    select: { userId: true },
  });

  let usersNotified = 0;
  let pushesSent = 0;

  for (const { userId } of tokenUsers) {
    const categories: CategoryPush[] = [];

    const habitsPending = await countHabitsPending(userId, todayNoonUTC, dow);
    if (habitsPending > 0) {
      categories.push({
        type: 'habits_due',
        screen: 'habits',
        title: 'Hábitos de hoy',
        body:
          habitsPending === 1
            ? 'Te queda 1 hábito por completar hoy.'
            : `Te quedan ${habitsPending} hábitos por completar hoy.`,
      });
    }

    const tasksDue = await countTasksDueToday(userId, todayStr);
    if (tasksDue > 0) {
      categories.push({
        type: 'tasks_due',
        screen: 'tasks',
        title: 'Tareas para hoy',
        body:
          tasksDue === 1
            ? 'Tenés 1 tarea que vence hoy.'
            : `Tenés ${tasksDue} tareas que vencen hoy.`,
      });
    }

    const expensesPending = await countExpensesPending(userId, month, year);
    if (expensesPending > 0) {
      categories.push({
        type: 'expenses_pending',
        screen: 'finance',
        title: 'Gastos pendientes',
        body:
          expensesPending === 1
            ? 'Tenés 1 gasto fijo sin pagar este mes.'
            : `Tenés ${expensesPending} gastos fijos sin pagar este mes.`,
      });
    }

    if (categories.length > 0) usersNotified++;

    for (const c of categories) {
      // Deduplicación: si ya se generó esta categoría hoy (ART), no repetir.
      const already = await prisma.notification.findFirst({
        where: { userId, type: c.type, createdAt: { gte: startOfArgDay } },
        select: { id: true },
      });
      if (already) continue;

      const data = { screen: c.screen };
      let pushSent = false;
      let pushError: string | null = null;

      try {
        const res = await sendToUser({ userId, title: c.title, body: c.body, data });
        pushSent = res.success && res.sentCount > 0;
        if (!pushSent && res.errors.length > 0) pushError = res.errors.join('; ');
      } catch (err) {
        pushError = err instanceof Error ? err.message : String(err);
      }

      if (pushSent) pushesSent++;

      await prisma.notification.create({
        data: {
          userId,
          type: c.type,
          title: c.title,
          body: c.body,
          data: JSON.stringify(data),
          pushSent,
          pushSentAt: pushSent ? new Date() : null,
          pushError,
        },
      });
    }
  }

  return { usersNotified, pushesSent };
}
