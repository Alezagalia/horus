/**
 * Event Reminder Notifications
 *
 * Envía un push cuando llega el momento del recordatorio de un evento
 * (Event.reminderMinutes antes de startDateTime). El cron corre cada 5 min:
 * toma los eventos pendientes y futuros cuyo recordatorio ya venció y que
 * todavía no fueron notificados (notificationSent=false), manda el push y
 * marca notificationSent=true.
 */

import { prisma } from '../lib/prisma.js';
import { sendToUser } from './push/push-notification.service.js';
import { isFirebaseConfigured } from '../lib/firebase-admin.js';

const TZ = 'America/Argentina/Buenos_Aires';

const timeFormatter = new Intl.DateTimeFormat('es-AR', {
  timeZone: TZ,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

export interface EventReminderResult {
  eventsNotified: number;
  pushesSent: number;
}

export async function notifyUpcomingEvents(): Promise<EventReminderResult> {
  // Sin Firebase no marcamos nada como notificado: los recordatorios de eventos
  // futuros quedan pendientes y disparan cuando se configuren las credenciales.
  if (!isFirebaseConfigured()) {
    return { eventsNotified: 0, pushesSent: 0 };
  }

  const now = new Date();

  // Candidatos: recordatorio configurado, no notificados, pendientes y futuros.
  // El corte "ya venció el recordatorio" se filtra en JS porque Prisma no puede
  // comparar startDateTime - reminderMinutes contra now() en el where.
  const candidates = await prisma.event.findMany({
    where: {
      notificationSent: false,
      reminderMinutes: { not: null },
      status: 'pendiente',
      startDateTime: { gt: now },
    },
    select: {
      id: true,
      userId: true,
      title: true,
      location: true,
      startDateTime: true,
      reminderMinutes: true,
    },
  });

  const due = candidates.filter(
    (e) => e.startDateTime.getTime() - (e.reminderMinutes ?? 0) * 60_000 <= now.getTime()
  );

  let pushesSent = 0;

  for (const event of due) {
    const startsAt = timeFormatter.format(event.startDateTime);
    const title = `📅 ${event.title}`;
    const body = event.location
      ? `Empieza a las ${startsAt} · ${event.location}`
      : `Empieza a las ${startsAt}`;

    const result = await sendToUser({
      userId: event.userId,
      title,
      body,
      data: {
        type: 'event_reminder',
        screen: 'events',
        eventId: event.id,
      },
    });

    // Se marca notificado aunque el push falle o no haya tokens: reintentar el
    // mismo recordatorio cada 5 min hasta el inicio del evento sería spam si el
    // token se recupera tarde, y el evento ya quedó registrado en Notification.
    await prisma.event.update({
      where: { id: event.id },
      data: { notificationSent: true },
    });

    await prisma.notification.create({
      data: {
        userId: event.userId,
        type: 'event_reminder',
        title,
        body,
        data: JSON.stringify({ eventId: event.id, startDateTime: event.startDateTime }),
        pushSent: result.success,
        pushSentAt: result.success ? new Date() : null,
        pushError: result.errors.length > 0 ? result.errors.join(', ') : null,
      },
    });

    if (result.success) pushesSent += result.sentCount;
  }

  return { eventsNotified: due.length, pushesSent };
}

export default { notifyUpcomingEvents };
