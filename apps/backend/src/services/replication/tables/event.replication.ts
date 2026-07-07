import { google } from 'googleapis';
import { Event, EventStatus, Scope } from '../../../generated/prisma/client.js';
import { logger } from '../../../lib/logger.js';
import { googleAuthService } from '../../googleAuth.service.js';
import { googleCalendarSyncService } from '../../googleCalendarSync.service.js';
import { PushContext, logIfConflict } from '../push-context.js';
import { recordTombstones } from '../tombstone.service.js';
import { EventRaw } from '../types.js';

/**
 * Replicación de eventos. El cliente solo crea/edita eventos SIMPLES (la UI
 * mobile no maneja recurrencia); los recurrentes y sus instancias los genera
 * el server y llegan por pull. Los campos de Google (googleEventId, sync*) y
 * notificationSent son server-only: no viajan en el raw y el push no los toca.
 * Las llamadas a Google Calendar van como postCommit (fuera del tx de Prisma),
 * best-effort igual que el REST.
 */

export function toRaw(e: Event): EventRaw {
  return {
    id: e.id,
    category_id: e.categoryId,
    title: e.title,
    description: e.description,
    location: e.location,
    start_date_time: e.startDateTime.getTime(),
    end_date_time: e.endDateTime.getTime(),
    is_all_day: e.isAllDay,
    is_recurring: e.isRecurring,
    recurring_event_id: e.recurringEventId,
    status: e.status,
    completed_at: e.completedAt ? e.completedAt.getTime() : null,
    canceled_at: e.canceledAt ? e.canceledAt.getTime() : null,
    archived_at: e.archivedAt ? e.archivedAt.getTime() : null,
    reminder_minutes: e.reminderMinutes,
    created_at: e.createdAt.getTime(),
    updated_at: e.updatedAt.getTime(),
  };
}

async function eventCategoryIsValid(ctx: PushContext, categoryId: string): Promise<boolean> {
  const category = await ctx.tx.category.findUnique({ where: { id: categoryId } });
  return category !== null && category.userId === ctx.userId && category.scope === Scope.eventos;
}

const msToDate = (ms: number | null | undefined): Date | null => (ms != null ? new Date(ms) : null);

function queueGoogleCreate(ctx: PushContext, eventId: string): void {
  const { userId } = ctx;
  ctx.postCommit.push(async () => {
    try {
      await googleCalendarSyncService.createGoogleEvent(userId, eventId);
    } catch (error) {
      logger.warn(`[replication] sync Google (create) fallo para event ${eventId}: ${error}`);
    }
  });
}

function queueGoogleUpdate(ctx: PushContext, eventId: string): void {
  const { userId } = ctx;
  ctx.postCommit.push(async () => {
    try {
      await googleCalendarSyncService.updateGoogleEvent(userId, eventId);
    } catch (error) {
      logger.warn(`[replication] sync Google (update) fallo para event ${eventId}: ${error}`);
    }
  });
}

/** La fila ya no existe al momento del postCommit: borra en Google por el
 * googleEventId capturado antes del delete. */
function queueGoogleDelete(ctx: PushContext, googleEventId: string): void {
  const { userId } = ctx;
  ctx.postCommit.push(async () => {
    try {
      const auth = await googleAuthService.getAuthenticatedClient(userId);
      const calendar = google.calendar({ version: 'v3', auth });
      await calendar.events.delete({ calendarId: 'primary', eventId: googleEventId });
    } catch (error: unknown) {
      const status =
        (error as { code?: number; status?: number }).code ?? (error as { status?: number }).status;
      if (status !== 404 && status !== 410) {
        logger.warn(
          `[replication] delete Google fallo para googleEventId ${googleEventId}: ${error}`
        );
      }
    }
  });
}

export async function applyCreated(ctx: PushContext, raws: EventRaw[]): Promise<void> {
  for (const raw of raws) {
    const existing = await ctx.tx.event.findUnique({ where: { id: raw.id } });
    if (existing) continue; // retry de push: no re-crear

    if (!(await eventCategoryIsValid(ctx, raw.category_id))) {
      logger.warn(`[replication] event ${raw.id} con categoría ajena/inválida: ignorado`);
      continue;
    }

    // Tombstone gana (los eventos hacen hard delete)
    const tombstone = await ctx.tx.replicationTombstone.findUnique({
      where: { tableName_rowId: { tableName: 'events', rowId: raw.id } },
    });
    if (tombstone) {
      logger.warn(`[replication] event ${raw.id} con tombstone previo: create ignorado`);
      continue;
    }

    if (raw.is_recurring) {
      // La UI mobile no crea recurrentes; si llegara, se acepta la fila padre
      // sin expandir instancias (sin rrule no hay qué expandir).
      logger.warn(`[replication] event ${raw.id} llegó como recurrente desde el cliente`);
    }

    await ctx.tx.event.create({
      data: {
        id: raw.id,
        userId: ctx.userId,
        categoryId: raw.category_id,
        title: raw.title,
        description: raw.description,
        location: raw.location,
        startDateTime: new Date(raw.start_date_time),
        endDateTime: new Date(raw.end_date_time),
        isAllDay: raw.is_all_day ?? false,
        isRecurring: false,
        status: raw.status as EventStatus,
        completedAt: msToDate(raw.completed_at),
        canceledAt: msToDate(raw.canceled_at),
        archivedAt: msToDate(raw.archived_at),
        reminderMinutes: raw.reminder_minutes,
        syncWithGoogle: true, // default del REST; el sync se resuelve post-commit
      },
    });

    queueGoogleCreate(ctx, raw.id);
  }
}

export async function applyUpdated(ctx: PushContext, raws: EventRaw[]): Promise<void> {
  for (const raw of raws) {
    const existing = await ctx.tx.event.findUnique({ where: { id: raw.id } });
    if (!existing) {
      await applyCreated(ctx, [raw]);
      continue;
    }
    if (existing.userId !== ctx.userId) continue;
    logIfConflict(ctx, 'events', raw.id, existing.updatedAt);

    let categoryId = raw.category_id;
    if (categoryId !== existing.categoryId && !(await eventCategoryIsValid(ctx, categoryId))) {
      categoryId = existing.categoryId;
    }

    // is_recurring / recurring_event_id / archived_at (cron) no se aceptan
    await ctx.tx.event.update({
      where: { id: raw.id },
      data: {
        categoryId,
        title: raw.title,
        description: raw.description,
        location: raw.location,
        startDateTime: new Date(raw.start_date_time),
        endDateTime: new Date(raw.end_date_time),
        isAllDay: raw.is_all_day,
        status: raw.status as EventStatus,
        completedAt: msToDate(raw.completed_at),
        canceledAt: msToDate(raw.canceled_at),
        reminderMinutes: raw.reminder_minutes,
      },
    });

    if (existing.syncWithGoogle) {
      queueGoogleUpdate(ctx, raw.id);
    }
  }
}

/** Hard delete con tombstones (evento + instancias hijas cascadeadas) y
 * borrado en Google post-commit. */
export async function applyDeleted(ctx: PushContext, ids: string[]): Promise<void> {
  for (const id of ids) {
    const existing = await ctx.tx.event.findUnique({ where: { id } });
    if (!existing) {
      await recordTombstones(ctx.tx, ctx.userId, 'events', [id]);
      continue;
    }
    if (existing.userId !== ctx.userId) continue;

    const instances = await ctx.tx.event.findMany({
      where: { recurringEventId: id },
      select: { id: true, googleEventId: true },
    });
    await recordTombstones(ctx.tx, ctx.userId, 'events', [id, ...instances.map((i) => i.id)]);

    for (const g of [existing, ...instances]) {
      if (g.googleEventId) queueGoogleDelete(ctx, g.googleEventId);
    }

    await ctx.tx.event.delete({ where: { id } });
  }
}
