/**
 * Habit Reminder Notifications
 *
 * Envía un push por hábito a la hora configurada en NotificationSetting.time
 * (HH:mm, hora Argentina). El cron corre cada 5 min: toma los hábitos con
 * recordatorio habilitado cuya hora ya pasó, que corresponden a hoy según su
 * periodicidad, que no están completados y que todavía no fueron avisados hoy
 * (dedupe por fila en Notification, igual que el digest diario).
 */

import { prisma } from '../lib/prisma.js';
import { sendScheduledHabitReminder } from './push/push-notification.service.js';
import { isFirebaseConfigured } from '../lib/firebase-admin.js';
import { parseISODateToNoonUTC } from '../utils/date.utils.js';

const TZ = 'America/Argentina/Buenos_Aires';

/** Espejo de la validación de periodicidad del digest diario. */
function isHabitDueToday(h: { periodicity: string; weekDays: number[] }, dow: number): boolean {
  if (h.periodicity === 'MONTHLY') return true;
  if (h.periodicity === 'WEEKLY') return h.weekDays.includes(dow);
  if (h.weekDays.length > 0) return h.weekDays.includes(dow);
  return true;
}

export interface HabitReminderResult {
  remindersSent: number;
}

export async function notifyHabitReminders(): Promise<HabitReminderResult> {
  // Sin Firebase no marcamos nada: los recordatorios disparan cuando haya creds
  if (!isFirebaseConfigured()) {
    return { remindersSent: 0 };
  }

  const now = new Date();
  const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(now);
  // h23 garantiza "00:xx" a medianoche (hour12:false puede dar "24:xx")
  const nowHHmm = new Intl.DateTimeFormat('es-AR', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(now);
  const todayNoonUTC = parseISODateToNoonUTC(todayStr);
  const dow = todayNoonUTC.getUTCDay();
  const startOfArgDay = new Date(`${todayStr}T00:00:00-03:00`);

  const settings = await prisma.notificationSetting.findMany({
    where: {
      enabled: true,
      habit: { isActive: true },
      // HH:mm compara bien como string ("09:30" <= "14:05")
      time: { lte: nowHHmm },
    },
    select: {
      habitId: true,
      userId: true,
      habit: { select: { periodicity: true, weekDays: true } },
    },
  });

  const due = settings.filter((s) => isHabitDueToday(s.habit, dow));
  if (due.length === 0) return { remindersSent: 0 };

  const habitIds = due.map((s) => s.habitId);

  // Ya completados hoy → no molestar
  const completed = await prisma.habitRecord.findMany({
    where: { habitId: { in: habitIds }, date: todayNoonUTC, completed: true },
    select: { habitId: true },
  });
  const completedSet = new Set(completed.map((r) => r.habitId));

  // Ya avisados hoy (sendScheduledHabitReminder guarda habitId en data)
  const sentToday = await prisma.notification.findMany({
    where: { type: 'habit_reminder', createdAt: { gte: startOfArgDay } },
    select: { data: true },
  });
  const notifiedSet = new Set<string>();
  for (const n of sentToday) {
    try {
      const habitId = JSON.parse(n.data ?? '{}').habitId;
      if (habitId) notifiedSet.add(habitId);
    } catch {
      // data ilegible: ignorar
    }
  }

  let remindersSent = 0;
  for (const s of due) {
    if (completedSet.has(s.habitId) || notifiedSet.has(s.habitId)) continue;
    try {
      await sendScheduledHabitReminder(s.habitId, s.userId);
      remindersSent++;
    } catch (error) {
      // Un hábito que falla no debe frenar el resto
      console.error(`[Habit Reminders] Error enviando recordatorio ${s.habitId}:`, error);
    }
  }

  return { remindersSent };
}

export default { notifyHabitReminders };
