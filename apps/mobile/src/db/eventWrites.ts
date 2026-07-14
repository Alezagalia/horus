import { Q } from '@nozbe/watermelondb';
import { database } from './index';
import { requestSync } from './syncScheduler';
import { Event as EventModel } from './models/Event';
import type { CreateEventDTO, UpdateEventDTO } from '@/services/api/eventApi';

/**
 * Escrituras locales del dominio Eventos (offline-first Fase 2c). La UI
 * mobile solo crea/edita eventos SIMPLES (sin recurrencia). El sync con
 * Google Calendar lo resuelve el server al procesar el push (post-commit).
 * El delete es HARD (tombstones server-side; borra también las instancias
 * hijas si se elimina un recurrente).
 */

const events = () => database.get<EventModel>('events');

/** Día completo: 00:00:00 → 23:59:59.999 UTC (igual que el backend). */
function normalizeAllDay(start: Date, end: Date): { start: Date; end: Date } {
  const s = new Date(start);
  s.setUTCHours(0, 0, 0, 0);
  const e = new Date(end);
  e.setUTCHours(23, 59, 59, 999);
  return { start: s, end: e };
}

export async function createEventLocal(dto: CreateEventDTO): Promise<void> {
  await database.write(async () => {
    let start = new Date(dto.startDateTime);
    let end = new Date(dto.endDateTime);
    if (dto.isAllDay) ({ start, end } = normalizeAllDay(start, end));

    await events().create((e) => {
      e.categoryId = dto.categoryId;
      e.title = dto.title;
      e.description = dto.description;
      e.location = dto.location;
      e.startDateTime = start;
      e.endDateTime = end;
      e.isAllDay = dto.isAllDay;
      e.isRecurring = false;
      e.status = 'pendiente';
      e.reminderMinutes = dto.reminderMinutes ?? undefined;
    });
  });
  requestSync();
}

export async function updateEventLocal(id: string, dto: UpdateEventDTO): Promise<void> {
  await database.write(async () => {
    const event = await events().find(id);
    await event.update((e) => {
      if (dto.title !== undefined) e.title = dto.title;
      if (dto.description !== undefined) e.description = dto.description;
      if (dto.location !== undefined) e.location = dto.location;
      if (dto.categoryId !== undefined) e.categoryId = dto.categoryId;
      if (dto.isAllDay !== undefined) e.isAllDay = dto.isAllDay;
      if (dto.reminderMinutes !== undefined) e.reminderMinutes = dto.reminderMinutes ?? undefined;

      let start = dto.startDateTime ? new Date(dto.startDateTime) : e.startDateTime;
      let end = dto.endDateTime ? new Date(dto.endDateTime) : e.endDateTime;
      if ((dto.isAllDay ?? e.isAllDay) && (dto.startDateTime || dto.endDateTime)) {
        ({ start, end } = normalizeAllDay(start, end));
      }
      e.startDateTime = start;
      e.endDateTime = end;

      if (dto.status !== undefined && dto.status !== e.status) {
        // Igual que el server: los timestamps acompañan la transición
        if (dto.status === 'completado') e.completedAt = new Date();
        if (dto.status === 'cancelado') e.canceledAt = new Date();
        e.status = dto.status;
      }
    });
  });
  requestSync();
}

/** Hard delete: viaja como `deleted` en el push (tombstones server-side).
 * Si es un recurrente, borra también sus instancias locales. */
export async function deleteEventLocal(id: string): Promise<void> {
  await database.write(async () => {
    const event = await events().find(id);
    const instances = await events().query(Q.where('recurring_event_id', id)).fetch();
    for (const instance of instances) {
      await instance.markAsDeleted();
    }
    await event.markAsDeleted();
  });
  requestSync();
}
