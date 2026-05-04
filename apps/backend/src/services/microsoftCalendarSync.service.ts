/**
 * Microsoft Calendar Sync Service
 * Sprint 15 - Multi-Calendar Support
 *
 * Handles one-way synchronization from Microsoft Calendar (Outlook)
 * to local Event records using Microsoft Graph API delta queries.
 */

import { prisma } from '../lib/prisma.js';
import { microsoftAuthService } from './microsoftAuth.service.js';
import { BadRequestError } from '../middlewares/error.middleware.js';

const MS_GRAPH_BASE = 'https://graph.microsoft.com/v1.0';

/**
 * Converts a Microsoft Graph event to local Event format.
 * Requests UTC times via Prefer header, so all datetimes have 'Z' appended.
 */
function convertFromMicrosoftEvent(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  msEvent: any,
  userId: string,
  categoryId: string,
  connectionId: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const localEvent: any = {
    userId,
    categoryId,
    calendarConnectionId: connectionId,
    externalEventId: msEvent.id,
    title: msEvent.subject || 'Sin título',
    description: msEvent.bodyPreview || null,
    location: msEvent.location?.displayName || null,
    syncWithGoogle: false,
  };

  if (msEvent.isAllDay) {
    // All-day events: start.dateTime is midnight UTC, end is exclusive (next day midnight)
    const startDate = new Date(msEvent.start.dateTime + 'Z');
    const endDate = new Date(msEvent.end.dateTime + 'Z');
    // Microsoft end is exclusive, subtract 1ms
    endDate.setDate(endDate.getDate() - 1);
    startDate.setUTCHours(0, 0, 0, 0);
    endDate.setUTCHours(23, 59, 59, 999);

    localEvent.startDateTime = startDate;
    localEvent.endDateTime = endDate;
    localEvent.isAllDay = true;
  } else {
    localEvent.startDateTime = new Date(msEvent.start.dateTime + 'Z');
    localEvent.endDateTime = new Date(msEvent.end.dateTime + 'Z');
    localEvent.isAllDay = false;
  }

  // Status
  if (msEvent.isCancelled) {
    localEvent.status = 'cancelado';
    localEvent.canceledAt = new Date();
  } else {
    localEvent.status = 'pendiente';
  }

  // Recurrence (simplified: mark as recurring but don't convert MS recurrence to rrule)
  localEvent.isRecurring = !!msEvent.recurrence;
  localEvent.rrule = null;

  return localEvent;
}

export const microsoftCalendarSyncService = {
  /**
   * Syncs events from Microsoft Calendar to local database.
   * Uses delta queries for incremental sync after the first run.
   */
  async syncFromMicrosoft(userId: string) {
    const connection = await prisma.calendarConnection.findUnique({
      where: { userId_provider: { userId, provider: 'MICROSOFT' } },
    });

    if (!connection || !connection.isActive) {
      throw new BadRequestError('Microsoft Calendar sync not enabled');
    }

    const accessToken = await microsoftAuthService.getAccessToken(userId);

    // Get default event category
    const defaultCategory = await prisma.category.findFirst({
      where: { userId, scope: 'eventos', isDefault: true },
    });

    if (!defaultCategory) {
      throw new BadRequestError('No default category found for events');
    }

    const stats = { fetched: 0, created: 0, updated: 0, deleted: 0, errors: 0 };
    let nextDeltaLink: string | null = null;

    // Build initial URL: delta or full range
    let url: string;
    if (connection.syncCursor) {
      url = connection.syncCursor; // Incremental: use stored deltaLink
    } else {
      // Full sync: events from 1 year ago to 1 year ahead
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      const oneYearAhead = new Date();
      oneYearAhead.setFullYear(oneYearAhead.getFullYear() + 1);

      url = `${MS_GRAPH_BASE}/me/calendarView/delta?startDateTime=${oneYearAgo.toISOString()}&endDateTime=${oneYearAhead.toISOString()}`;
    }

    // Paginate through all pages
    while (url) {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          // Request UTC times and limit page size
          Prefer: 'outlook.timezone="UTC", odata.maxpagesize=100',
        },
      });

      if (!response.ok) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const error = (await response.json()) as any;
        throw new BadRequestError(
          error.error?.message || 'Failed to fetch Microsoft Calendar events'
        );
      }

      const data = (await response.json()) as {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        value: any[];
        '@odata.nextLink'?: string;
        '@odata.deltaLink'?: string;
      };

      const msEvents = data.value || [];
      stats.fetched += msEvents.length;

      for (const msEvent of msEvents) {
        try {
          if (!msEvent.id) continue;

          // Deleted event in delta response
          if (msEvent['@removed']) {
            const existing = await prisma.event.findFirst({
              where: { externalEventId: msEvent.id, calendarConnectionId: connection.id },
            });
            if (existing) {
              await prisma.event.update({
                where: { id: existing.id },
                data: { status: 'cancelado', canceledAt: new Date() },
              });
              stats.deleted++;
            }
            continue;
          }

          // Cancelled event
          if (msEvent.isCancelled) {
            const existing = await prisma.event.findFirst({
              where: { externalEventId: msEvent.id, calendarConnectionId: connection.id },
            });
            if (existing) {
              await prisma.event.update({
                where: { id: existing.id },
                data: { status: 'cancelado', canceledAt: new Date() },
              });
              stats.deleted++;
            }
            continue;
          }

          const localEventData = convertFromMicrosoftEvent(
            msEvent,
            userId,
            defaultCategory.id,
            connection.id
          );

          const existingEvent = await prisma.event.findFirst({
            where: { externalEventId: msEvent.id, calendarConnectionId: connection.id },
          });

          if (existingEvent) {
            // Update if Microsoft version is newer
            const msUpdated = msEvent.lastModifiedDateTime
              ? new Date(msEvent.lastModifiedDateTime)
              : new Date();

            if (msUpdated > existingEvent.updatedAt) {
              await prisma.event.update({
                where: { id: existingEvent.id },
                data: {
                  ...localEventData,
                  id: existingEvent.id,
                  createdAt: existingEvent.createdAt,
                },
              });
              stats.updated++;
            }
          } else {
            await prisma.event.create({ data: localEventData });
            stats.created++;
          }
        } catch (error) {
          console.error(`Error processing Microsoft event ${msEvent.id}:`, error);
          stats.errors++;
        }
      }

      // Follow pagination
      if (data['@odata.nextLink']) {
        url = data['@odata.nextLink'];
      } else {
        nextDeltaLink = data['@odata.deltaLink'] || null;
        break;
      }
    }

    // Save sync cursor and update lastSyncAt
    await prisma.calendarConnection.update({
      where: { userId_provider: { userId, provider: 'MICROSOFT' } },
      data: {
        lastSyncAt: new Date(),
        syncCursor: nextDeltaLink,
      },
    });

    const conflictNote = stats.errors > 0 ? `, ${stats.errors} errores` : '';

    return {
      success: true,
      message: `Sincronización completada: ${stats.created} creados, ${stats.updated} actualizados, ${stats.deleted} eliminados${conflictNote}`,
      eventsImported: stats.created,
      eventsUpdated: stats.updated,
      eventsDeleted: stats.deleted,
    };
  },
};
