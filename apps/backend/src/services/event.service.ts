/**
 * Event Service
 * Sprint 8 - US-066
 */

import { prisma } from '../lib/prisma.js';
import { Scope } from '../generated/prisma/client.js';
import { NotFoundError, BadRequestError } from '../middlewares/error.middleware.js';
import rrule from 'rrule';
const { RRule } = rrule;
import {
  CreateEventDTO,
  UpdateEventDTO,
  GetEventsQueryDTO,
} from '../validations/event.validation.js';
import { googleCalendarSyncService } from './googleCalendarSync.service.js';

export const eventService = {
  /**
   * Expande eventos recurrentes para generar instancias en un rango de fechas
   */
  expandRecurringEvents(
    rruleString: string,
    _startDateTime: Date,
    _endDateTime: Date,
    fromDate: Date,
    toDate: Date
  ): Date[] {
    try {
      const rrule = RRule.fromString(rruleString);
      const occurrences = rrule.between(fromDate, toDate, true);

      return occurrences;
    } catch (error) {
      console.error('Error expanding recurring events:', error);
      return [];
    }
  },

  /**
   * Normaliza fechas para eventos de día completo
   */
  normalizeDateTimesForAllDay(start: Date, end: Date): { start: Date; end: Date } {
    const normalizedStart = new Date(start);
    normalizedStart.setHours(0, 0, 0, 0);

    const normalizedEnd = new Date(end);
    normalizedEnd.setHours(23, 59, 59, 999);

    return { start: normalizedStart, end: normalizedEnd };
  },

  /**
   * Crea un nuevo evento
   */
  async create(userId: string, data: CreateEventDTO) {
    // Validate category exists and belongs to user with scope 'eventos'
    const category = await prisma.category.findFirst({
      where: {
        id: data.categoryId,
        userId,
        scope: Scope.eventos,
      },
    });

    if (!category) {
      throw new BadRequestError('Category not found or does not have scope eventos');
    }

    let startDateTime = new Date(data.startDateTime);
    let endDateTime = new Date(data.endDateTime);

    // Normalize times for all-day events
    if (data.isAllDay) {
      const normalized = this.normalizeDateTimesForAllDay(startDateTime, endDateTime);
      startDateTime = normalized.start;
      endDateTime = normalized.end;
    }

    // Create main event
    const event = await prisma.event.create({
      data: {
        userId,
        categoryId: data.categoryId,
        title: data.title,
        description: data.description,
        location: data.location,
        startDateTime,
        endDateTime,
        isAllDay: data.isAllDay,
        isRecurring: data.isRecurring,
        rrule: data.rrule,
        reminderMinutes: data.reminderMinutes,
        syncWithGoogle: data.syncWithGoogle,
      },
      include: {
        category: true,
      },
    });

    // If recurring, generate instances for next 30 days
    if (data.isRecurring && data.rrule) {
      const now = new Date();
      const next30Days = new Date(now);
      next30Days.setDate(next30Days.getDate() + 30);

      const occurrences = this.expandRecurringEvents(
        data.rrule,
        startDateTime,
        endDateTime,
        now,
        next30Days
      );

      // Create instances (skip first occurrence as it's the parent event)
      const instances = occurrences.slice(1).map((occurrenceStart) => {
        const duration = endDateTime.getTime() - startDateTime.getTime();
        const occurrenceEnd = new Date(occurrenceStart.getTime() + duration);

        return {
          userId,
          categoryId: data.categoryId,
          title: data.title,
          description: data.description,
          location: data.location,
          startDateTime: occurrenceStart,
          endDateTime: occurrenceEnd,
          isAllDay: data.isAllDay,
          isRecurring: false, // Instances are not recurring themselves
          recurringEventId: event.id,
          reminderMinutes: data.reminderMinutes,
          syncWithGoogle: data.syncWithGoogle,
        };
      });

      if (instances.length > 0) {
        await prisma.event.createMany({
          data: instances,
        });
      }
    }

    // Sync to Google Calendar if enabled
    if (event.syncWithGoogle) {
      try {
        await googleCalendarSyncService.createGoogleEvent(userId, event.id);
      } catch (error) {
        console.error('Error syncing event to Google Calendar:', error);
        // Don't fail the event creation if sync fails
        // Error is already logged in sync service with retry logic
      }
    }

    return event;
  },

  /**
   * Obtiene todos los eventos del usuario en un rango de fechas
   */
  async findAll(userId: string, query: GetEventsQueryDTO) {
    const fromDate = new Date(query.from);
    const toDate = new Date(query.to);

    const where: any = {
      userId,
      archivedAt: null,
      OR: [
        {
          // Events that start in range
          startDateTime: {
            gte: fromDate,
            lte: toDate,
          },
        },
        {
          // Events that end in range
          endDateTime: {
            gte: fromDate,
            lte: toDate,
          },
        },
        {
          // Events that span the entire range
          AND: [{ startDateTime: { lte: fromDate } }, { endDateTime: { gte: toDate } }],
        },
      ],
    };

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query.status) {
      where.status = query.status;
    }

    const events = await prisma.event.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: {
        startDateTime: 'asc',
      },
    });

    return events;
  },

  /**
   * Obtiene un evento por ID
   */
  async findById(userId: string, eventId: string) {
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        userId,
      },
      include: {
        category: true,
        instances: {
          where: {
            startDateTime: {
              gte: new Date(),
            },
          },
          orderBy: {
            startDateTime: 'asc',
          },
          take: 10, // Next 10 occurrences
        },
      },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    return event;
  },

  /**
   * Actualiza un evento
   */
  async update(userId: string, eventId: string, data: UpdateEventDTO) {
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        userId,
      },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    // Validate category if provided
    if (data.categoryId) {
      const category = await prisma.category.findFirst({
        where: {
          id: data.categoryId,
          userId,
          scope: Scope.eventos,
        },
      });

      if (!category) {
        throw new BadRequestError('Category not found or does not have scope eventos');
      }
    }

    const updateData: any = {
      ...data,
    };

    // Handle status changes
    if (data.status === 'completado' && event.status !== 'completado') {
      updateData.completedAt = new Date();
    }

    if (data.status === 'cancelado' && event.status !== 'cancelado') {
      updateData.canceledAt = new Date();
    }

    // Normalize times for all-day events if isAllDay is being set
    if (data.isAllDay && (data.startDateTime || data.endDateTime)) {
      const start = data.startDateTime ? new Date(data.startDateTime) : event.startDateTime;
      const end = data.endDateTime ? new Date(data.endDateTime) : event.endDateTime;
      const normalized = this.normalizeDateTimesForAllDay(start, end);
      updateData.startDateTime = normalized.start;
      updateData.endDateTime = normalized.end;
    } else {
      if (data.startDateTime) updateData.startDateTime = new Date(data.startDateTime);
      if (data.endDateTime) updateData.endDateTime = new Date(data.endDateTime);
    }

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: updateData,
      include: {
        category: true,
      },
    });

    // Sync to Google Calendar if enabled
    if (updatedEvent.syncWithGoogle) {
      try {
        await googleCalendarSyncService.updateGoogleEvent(userId, eventId);
      } catch (error) {
        console.error('Error syncing event update to Google Calendar:', error);
        // Don't fail the update if sync fails
        // Error is already logged in sync service with retry logic
      }
    } else if (event.syncWithGoogle && !updatedEvent.syncWithGoogle) {
      // Sync was disabled, delete from Google
      if (updatedEvent.googleEventId) {
        try {
          await googleCalendarSyncService.deleteGoogleEvent(userId, eventId);
          // Clear Google ID
          await prisma.event.update({
            where: { id: eventId },
            data: { googleEventId: null },
          });
        } catch (error) {
          console.error('Error deleting event from Google Calendar:', error);
        }
      }
    }

    return updatedEvent;
  },

  /**
   * Elimina un evento
   */
  async delete(userId: string, eventId: string) {
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        userId,
      },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    // Delete from Google Calendar if synced
    if (event.googleEventId && event.syncWithGoogle) {
      try {
        await googleCalendarSyncService.deleteGoogleEvent(userId, eventId);
      } catch (error) {
        console.error('Error deleting event from Google Calendar:', error);
        // Continue with local deletion even if Google deletion fails
      }
    }

    await prisma.event.delete({
      where: { id: eventId },
    });

    return { message: 'Event deleted successfully' };
  },
};
