import { Q } from '@nozbe/watermelondb';
import { addDays } from 'date-fns';
import { database } from './index';
import { Event as EventModel } from './models/Event';
import { Category as CategoryModel } from './models/Category';
import type { UpcomingEvent, CalendarEvent } from '@/services/api/eventApi';

/**
 * Lecturas locales del dominio Eventos (offline-first Fase 2c). Espeja el
 * filtro de rango del backend (event.service.findAll): eventos que empiezan,
 * terminan o abarcan el rango; excluye archivados. Las instancias de eventos
 * recurrentes son filas normales (las genera el server), así que el rango
 * las trae sin parsear rrule.
 */

const events = () => database.get<EventModel>('events');
const categories = () => database.get<CategoryModel>('categories');

async function listInRange(fromMs: number, toMs: number): Promise<EventModel[]> {
  const rows = await events()
    .query(
      Q.where('archived_at', null),
      Q.or(
        Q.and(Q.where('start_date_time', Q.gte(fromMs)), Q.where('start_date_time', Q.lte(toMs))),
        Q.and(Q.where('end_date_time', Q.gte(fromMs)), Q.where('end_date_time', Q.lte(toMs))),
        Q.and(Q.where('start_date_time', Q.lte(fromMs)), Q.where('end_date_time', Q.gte(toMs)))
      )
    )
    .fetch();
  rows.sort((a, b) => a.startDateTime.getTime() - b.startDateTime.getTime());
  return rows;
}

/** GET /events?from=now&to=+N días (shape UpcomingEvent del dashboard). */
export async function listUpcomingEventsLocal(days = 3): Promise<UpcomingEvent[]> {
  const now = new Date();
  const rows = await listInRange(now.getTime(), addDays(now, days).getTime());
  const categoryById = new Map((await categories().query().fetch()).map((c) => [c.id, c]));

  return rows.map((e) => {
    const category = categoryById.get(e.categoryId);
    return {
      id: e.id,
      title: e.title,
      startDateTime: e.startDateTime.toISOString(),
      endDateTime: e.endDateTime.toISOString(),
      isAllDay: e.isAllDay,
      category: category
        ? { name: category.name, color: category.color ?? '', icon: category.icon ?? '' }
        : undefined,
    };
  });
}

/** GET /events?from&to (shape CalendarEvent de agenda/timeline). */
export async function listCalendarEventsLocal(from: string, to: string): Promise<CalendarEvent[]> {
  const rows = await listInRange(new Date(from).getTime(), new Date(to).getTime());
  const categoryById = new Map((await categories().query().fetch()).map((c) => [c.id, c]));

  return rows.map((e) => {
    const category = categoryById.get(e.categoryId);
    return {
      id: e.id,
      title: e.title,
      startDateTime: e.startDateTime.toISOString(),
      endDateTime: e.endDateTime.toISOString(),
      isAllDay: e.isAllDay,
      status: e.status as CalendarEvent['status'],
      description: e.description ?? undefined,
      location: e.location ?? undefined,
      categoryId: e.categoryId,
      category: category
        ? {
            id: category.id,
            name: category.name,
            icon: category.icon ?? undefined,
            color: category.color ?? undefined,
          }
        : undefined,
      isRecurring: e.isRecurring,
      updatedAt: e.updatedAt.toISOString(),
    };
  });
}
