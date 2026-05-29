/**
 * Google Calendar Sync Service
 * Sprint 8 - US-068
 *
 * Handles synchronization of local events to Google Calendar
 */

import { google } from 'googleapis';
import { prisma } from '../lib/prisma.js';
import { googleAuthService } from './googleAuth.service.js';
import { BadRequestError, NotFoundError } from '../middlewares/error.middleware.js';

const MAX_RETRY_COUNT = 5;
const INITIAL_RETRY_DELAY_MS = 1000; // 1 second

/**
 * Converts Google Calendar event to local Event format
 */
function convertFromGoogleEvent(googleEvent: any, userId: string, defaultCategoryId: string): any {
  const localEvent: any = {
    userId,
    categoryId: defaultCategoryId,
    title: googleEvent.summary || 'Sin título',
    description: googleEvent.description || null,
    location: googleEvent.location || null,
    googleEventId: googleEvent.id,
    syncWithGoogle: true,
  };

  // Handle all-day events
  if (googleEvent.start.date) {
    // All-day event (has 'date' instead of 'dateTime')
    // IMPORTANT: new Date("YYYY-MM-DD") parses as UTC midnight, which shifts the date
    // one day back in UTC-3 timezones. Parse components manually and use noon UTC
    // so the date is correct for any timezone within ±12h of UTC.
    const [sy, sm, sd] = googleEvent.start.date.split('-').map(Number);
    const startDate = new Date(Date.UTC(sy, sm - 1, sd, 12, 0, 0, 0));

    // Google end date is exclusive, so subtract 1 day
    const [ey, em, ed] = googleEvent.end.date.split('-').map(Number);
    const endDate = new Date(Date.UTC(ey, em - 1, ed - 1, 23, 59, 59, 999));

    localEvent.startDateTime = startDate;
    localEvent.endDateTime = endDate;
    localEvent.isAllDay = true;
  } else {
    // Timed event — dateTime includes timezone offset, JavaScript parses it correctly
    localEvent.startDateTime = new Date(googleEvent.start.dateTime);
    localEvent.endDateTime = new Date(googleEvent.end.dateTime);
    localEvent.isAllDay = false;
  }

  // Handle recurrence
  if (googleEvent.recurrence && googleEvent.recurrence.length > 0) {
    localEvent.isRecurring = true;
    localEvent.rrule = googleEvent.recurrence[0]; // First rule
  } else {
    localEvent.isRecurring = false;
    localEvent.rrule = null;
  }

  // Handle reminders
  if (googleEvent.reminders?.overrides && googleEvent.reminders.overrides.length > 0) {
    // Take first reminder
    localEvent.reminderMinutes = googleEvent.reminders.overrides[0].minutes;
  } else {
    localEvent.reminderMinutes = null;
  }

  // Handle status
  if (googleEvent.status === 'cancelled') {
    localEvent.status = 'cancelado';
    localEvent.canceledAt = new Date();
  } else {
    localEvent.status = 'pendiente';
  }

  return localEvent;
}

/**
 * Formats a UTC Date as a dateTime string with Buenos Aires offset (-03:00).
 * Argentina is always UTC-3 (no DST).
 *
 * Using the explicit offset avoids the ambiguity that arises when a UTC "Z"
 * datetime is combined with a separate timeZone field — Google Calendar may
 * otherwise use the UTC calendar date instead of the local date for display.
 */
function toBuenosAiresDateTimeString(utcDate: Date): string {
  const offsetMs = -3 * 60 * 60 * 1000; // -3 h
  const local = new Date(utcDate.getTime() + offsetMs);
  return local.toISOString().slice(0, -1) + '-03:00';
}

/**
 * Converts local Event to Google Calendar event format
 */
function convertToGoogleEvent(event: any): any {
  const googleEvent: any = {
    summary: event.title,
    description: event.description || undefined,
    location: event.location || undefined,
  };

  // Handle all-day events
  if (event.isAllDay) {
    // Google uses date format (YYYY-MM-DD) for all-day events.
    // All-day startDateTime is stored as noon UTC so toISOString().split('T')[0]
    // always yields the correct calendar date.
    const startDate = new Date(event.startDateTime);
    const endDate = new Date(event.endDateTime);

    // Add 1 day to end date for Google Calendar (exclusive end date).
    // Use UTC methods to avoid local-time surprises on the server.
    endDate.setUTCDate(endDate.getUTCDate() + 1);

    googleEvent.start = {
      date: startDate.toISOString().split('T')[0],
      timeZone: 'America/Argentina/Buenos_Aires',
    };
    googleEvent.end = {
      date: endDate.toISOString().split('T')[0],
      timeZone: 'America/Argentina/Buenos_Aires',
    };
  } else {
    // Timed events: send with Buenos Aires offset so Google unambiguously
    // places the event on the correct local calendar date.
    googleEvent.start = {
      dateTime: toBuenosAiresDateTimeString(new Date(event.startDateTime)),
      timeZone: 'America/Argentina/Buenos_Aires',
    };
    googleEvent.end = {
      dateTime: toBuenosAiresDateTimeString(new Date(event.endDateTime)),
      timeZone: 'America/Argentina/Buenos_Aires',
    };
  }

  // Add recurrence rule if present
  if (event.isRecurring && event.rrule) {
    googleEvent.recurrence = [event.rrule];
  }

  // Add reminders
  if (event.reminderMinutes !== null && event.reminderMinutes !== undefined) {
    googleEvent.reminders = {
      useDefault: false,
      overrides: [
        {
          method: 'popup',
          minutes: event.reminderMinutes,
        },
      ],
    };
  } else {
    googleEvent.reminders = {
      useDefault: true,
    };
  }

  return googleEvent;
}

/**
 * Calculates next retry delay using exponential backoff
 */
function calculateRetryDelay(retryCount: number): number {
  return INITIAL_RETRY_DELAY_MS * Math.pow(2, retryCount);
}

export const googleCalendarSyncService = {
  /**
   * Creates an event in Google Calendar
   */
  async createGoogleEvent(userId: string, eventId: string) {
    try {
      // Get event from database
      const event = await prisma.event.findFirst({
        where: { id: eventId, userId },
      });

      if (!event) {
        throw new NotFoundError('Event not found');
      }

      // Skip if sync is disabled for this event
      if (!event.syncWithGoogle) {
        return { success: true, skipped: true, reason: 'Sync disabled for event' };
      }

      // Skip if already synced
      if (event.googleEventId) {
        return { success: true, skipped: true, reason: 'Event already synced' };
      }

      // Get authenticated Google Calendar client
      const auth = await googleAuthService.getAuthenticatedClient(userId);
      const calendar = google.calendar({ version: 'v3', auth });

      // Convert to Google format
      const googleEvent = convertToGoogleEvent(event);

      // Create event in Google Calendar
      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: googleEvent,
      });

      if (!response.data.id) {
        throw new BadRequestError('Failed to create event in Google Calendar');
      }

      // Update local event with Google ID
      await prisma.event.update({
        where: { id: eventId },
        data: {
          googleEventId: response.data.id,
          syncRetryCount: 0,
          syncNextRetryAt: null,
          syncLastError: null,
        },
      });

      return {
        success: true,
        googleEventId: response.data.id,
      };
    } catch (error: any) {
      console.error('Error creating Google event:', error);

      // Handle specific error cases
      await this.handleSyncError(eventId, error);

      throw error;
    }
  },

  /**
   * Updates an event in Google Calendar
   */
  async updateGoogleEvent(userId: string, eventId: string) {
    try {
      // Get event from database
      const event = await prisma.event.findFirst({
        where: { id: eventId, userId },
      });

      if (!event) {
        throw new NotFoundError('Event not found');
      }

      // Skip if sync is disabled
      if (!event.syncWithGoogle) {
        return { success: true, skipped: true, reason: 'Sync disabled for event' };
      }

      // Skip if not synced yet
      if (!event.googleEventId) {
        // Try to create instead
        return await this.createGoogleEvent(userId, eventId);
      }

      // Get authenticated Google Calendar client
      const auth = await googleAuthService.getAuthenticatedClient(userId);
      const calendar = google.calendar({ version: 'v3', auth });

      // Convert to Google format
      const googleEvent = convertToGoogleEvent(event);

      // Update event in Google Calendar
      const response = await calendar.events.update({
        calendarId: 'primary',
        eventId: event.googleEventId,
        requestBody: googleEvent,
      });

      // Reset retry fields on success
      await prisma.event.update({
        where: { id: eventId },
        data: {
          syncRetryCount: 0,
          syncNextRetryAt: null,
          syncLastError: null,
        },
      });

      return {
        success: true,
        googleEventId: response.data.id,
      };
    } catch (error: any) {
      console.error('Error updating Google event:', error);

      // Handle 404 - event doesn't exist in Google anymore
      if (error.code === 404 || error.status === 404) {
        // Clear Google ID and try to recreate
        await prisma.event.update({
          where: { id: eventId },
          data: {
            googleEventId: null,
            syncRetryCount: 0,
            syncNextRetryAt: null,
            syncLastError: 'Event not found in Google Calendar, recreating',
          },
        });

        return await this.createGoogleEvent(userId, eventId);
      }

      // Handle other errors
      await this.handleSyncError(eventId, error);

      throw error;
    }
  },

  /**
   * Deletes an event from Google Calendar
   */
  async deleteGoogleEvent(userId: string, eventId: string) {
    try {
      // Get event from database
      const event = await prisma.event.findFirst({
        where: { id: eventId, userId },
      });

      if (!event) {
        throw new NotFoundError('Event not found');
      }

      // Skip if not synced
      if (!event.googleEventId) {
        return { success: true, skipped: true, reason: 'Event not synced to Google' };
      }

      // Get authenticated Google Calendar client
      const auth = await googleAuthService.getAuthenticatedClient(userId);
      const calendar = google.calendar({ version: 'v3', auth });

      // Delete event from Google Calendar
      await calendar.events.delete({
        calendarId: 'primary',
        eventId: event.googleEventId,
      });

      return {
        success: true,
        message: 'Event deleted from Google Calendar',
      };
    } catch (error: any) {
      console.error('Error deleting Google event:', error);

      // If event doesn't exist in Google (404), consider it success
      if (error.code === 404 || error.status === 404) {
        return {
          success: true,
          message: 'Event already deleted from Google Calendar',
        };
      }

      // Handle other errors
      await this.handleSyncError(eventId, error);

      throw error;
    }
  },

  /**
   * Handles sync errors with exponential backoff retry logic
   */
  async handleSyncError(eventId: string, error: any) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) return;

    const newRetryCount = event.syncRetryCount + 1;
    const errorMessage = error.message || 'Unknown error';

    // Check if max retries exceeded
    if (newRetryCount > MAX_RETRY_COUNT) {
      await prisma.event.update({
        where: { id: eventId },
        data: {
          syncRetryCount: newRetryCount,
          syncNextRetryAt: null,
          syncLastError: `Max retries exceeded: ${errorMessage}`,
        },
      });
      return;
    }

    // Handle rate limiting (429)
    if (error.code === 429 || error.status === 429) {
      const retryAfter = error.response?.headers?.['retry-after'];
      const retryDelay = retryAfter
        ? parseInt(retryAfter) * 1000
        : calculateRetryDelay(newRetryCount);
      const nextRetryAt = new Date(Date.now() + retryDelay);

      await prisma.event.update({
        where: { id: eventId },
        data: {
          syncRetryCount: newRetryCount,
          syncNextRetryAt: nextRetryAt,
          syncLastError: `Rate limited: ${errorMessage}`,
        },
      });
      return;
    }

    // Handle auth errors (401)
    if (error.code === 401 || error.status === 401) {
      // Token refresh should be handled by googleAuthService.getAuthenticatedClient
      // If we still get 401, mark for manual reconnection
      await prisma.event.update({
        where: { id: eventId },
        data: {
          syncRetryCount: newRetryCount,
          syncNextRetryAt: null,
          syncLastError: `Authentication error: ${errorMessage}. Please reconnect Google Calendar.`,
        },
      });
      return;
    }

    // Generic error with exponential backoff
    const retryDelay = calculateRetryDelay(newRetryCount);
    const nextRetryAt = new Date(Date.now() + retryDelay);

    await prisma.event.update({
      where: { id: eventId },
      data: {
        syncRetryCount: newRetryCount,
        syncNextRetryAt: nextRetryAt,
        syncLastError: errorMessage.substring(0, 500), // Limit error message length
      },
    });
  },

  /**
   * Retries failed sync operations for events ready for retry
   */
  async retryFailedSyncs() {
    const now = new Date();

    // Find events ready for retry
    const eventsToRetry = await prisma.event.findMany({
      where: {
        syncWithGoogle: true,
        syncNextRetryAt: {
          lte: now,
        },
        syncRetryCount: {
          lte: MAX_RETRY_COUNT,
        },
      },
      take: 10, // Process 10 at a time
    });

    const results = [];

    for (const event of eventsToRetry) {
      try {
        if (event.googleEventId) {
          // Event exists in Google, update it
          await this.updateGoogleEvent(event.userId, event.id);
        } else {
          // Event doesn't exist in Google, create it
          await this.createGoogleEvent(event.userId, event.id);
        }

        results.push({
          eventId: event.id,
          success: true,
        });
      } catch (error) {
        results.push({
          eventId: event.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      processed: results.length,
      results,
    };
  },

  /**
   * Fetches events from Google Calendar since a specific date
   */
  async fetchGoogleEvents(userId: string, since?: Date) {
    try {
      const auth = await googleAuthService.getAuthenticatedClient(userId);
      const calendar = google.calendar({ version: 'v3', auth });

      const params: any = {
        calendarId: 'primary',
        maxResults: 2500,
        singleEvents: true, // Expand recurring events
        orderBy: 'startTime',
      };

      // Always apply -1 month / +3 months window
      const timeMin = new Date();
      timeMin.setMonth(timeMin.getMonth() - 1);
      const timeMax = new Date();
      timeMax.setMonth(timeMax.getMonth() + 3);

      params.timeMin = timeMin.toISOString();
      params.timeMax = timeMax.toISOString();

      if (since) {
        // Incremental: also limit to events modified since last sync
        params.updatedMin = since.toISOString();
      }

      const response = await calendar.events.list(params);

      return response.data.items || [];
    } catch (error: any) {
      console.error('Error fetching Google events:', error);
      throw error;
    }
  },

  /**
   * Syncs events from Google Calendar to local database.
   * @param forceResync When true, bypasses last-write-wins and always applies Google's version.
   *                    Use this to correct events imported with wrong dates.
   */
  async syncFromGoogle(userId: string, forceResync = false) {
    try {
      // Get sync settings
      const syncSetting = await prisma.syncSetting.findUnique({
        where: { userId },
      });

      if (!syncSetting || !syncSetting.googleCalendarEnabled) {
        throw new BadRequestError('Google Calendar sync not enabled');
      }

      // Get default category for events
      const defaultCategory = await prisma.category.findFirst({
        where: {
          userId,
          scope: 'eventos',
          isDefault: true,
        },
      });

      if (!defaultCategory) {
        throw new BadRequestError('No default category found for events');
      }

      // Check if this is the first real sync (no events synced yet)
      const syncedEventsCount = await prisma.event.count({
        where: {
          userId,
          syncWithGoogle: true,
          googleEventId: { not: null },
        },
      });

      // forceResync and first-sync both fetch everything without date filter
      const fetchSince =
        forceResync || syncedEventsCount === 0 ? undefined : syncSetting.lastSyncAt || undefined;
      const googleEvents = await this.fetchGoogleEvents(userId, fetchSince);

      const stats = {
        fetched: googleEvents.length,
        created: 0,
        updated: 0,
        deleted: 0,
        conflicts: 0,
        errors: 0,
      };

      // Process each Google event
      for (const googleEvent of googleEvents) {
        try {
          // Skip if no ID
          if (!googleEvent.id) continue;

          // Check if event exists locally by googleEventId
          const existingEvent = await prisma.event.findFirst({
            where: {
              googleEventId: googleEvent.id,
            },
          });

          // Handle cancelled events
          if (googleEvent.status === 'cancelled') {
            if (existingEvent) {
              // Mark as cancelled or delete
              await prisma.event.update({
                where: { id: existingEvent.id },
                data: {
                  status: 'cancelado',
                  canceledAt: new Date(),
                },
              });
              stats.deleted++;
            }
            continue;
          }

          // Convert Google event to local format
          const localEventData = convertFromGoogleEvent(googleEvent, userId, defaultCategory.id);

          if (existingEvent) {
            const googleUpdated = googleEvent.updated ? new Date(googleEvent.updated) : new Date();
            const localUpdated = existingEvent.updatedAt;

            // forceResync always overwrites local; otherwise use last-write-wins
            if (forceResync || googleUpdated > localUpdated) {
              await prisma.event.update({
                where: { id: existingEvent.id },
                data: {
                  ...localEventData,
                  id: existingEvent.id,
                  createdAt: existingEvent.createdAt,
                  recurringEventId: existingEvent.recurringEventId,
                },
              });
              stats.updated++;
            } else {
              stats.conflicts++;
              if (stats.conflicts <= 10) {
                console.log(`Conflict: Local event ${existingEvent.id} is more recent than Google`);
              } else if (stats.conflicts === 11) {
                console.log('Additional conflicts suppressed for log cleanliness');
              }
            }
          } else {
            // Event doesn't exist, create new
            await prisma.event.create({
              data: localEventData,
            });
            stats.created++;
          }
        } catch (error) {
          console.error(`Error processing Google event ${googleEvent.id}:`, error);
          stats.errors++;
        }
      }

      // Update lastSyncAt timestamp
      await prisma.syncSetting.update({
        where: { userId },
        data: {
          lastSyncAt: new Date(),
        },
      });

      const conflictMsg =
        stats.conflicts > 0 ? `, ${stats.conflicts} conflictos (versión local más reciente)` : '';
      const prefix = forceResync ? 'Re-sincronización forzada' : 'Sincronización';
      return {
        success: true,
        message: `${prefix} completada: ${stats.created} creados, ${stats.updated} actualizados${conflictMsg}`,
        eventsImported: stats.created,
        eventsUpdated: stats.updated,
        eventsDeleted: stats.deleted,
      };
    } catch (error: any) {
      console.error('Error syncing from Google Calendar:', error);
      throw error;
    }
  },
};
