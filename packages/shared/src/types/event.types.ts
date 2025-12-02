/**
 * Event (Calendar) Types
 * Sprint 13 - US-117
 */

export type EventStatus = 'pendiente' | 'completado' | 'cancelado';

export interface CalendarEvent {
  id: string;
  userId: string;
  categoryId: string;
  title: string;
  description?: string | null;
  location?: string | null;
  date: string; // ISO date string (simplified for calendar - derived from startDateTime)
  startDateTime: string; // ISO datetime string
  endDateTime: string; // ISO datetime string
  isAllDay: boolean;
  isRecurring: boolean;
  rrule?: string | null;
  recurringEventId?: string | null;
  status: EventStatus;
  completedAt?: string | null;
  canceledAt?: string | null;
  archivedAt?: string | null;
  syncWithGoogle: boolean;
  googleEventId?: string | null;
  source?: 'google_calendar' | 'horus';
  reminderMinutes?: number | null;
  notificationSent: boolean;
  createdAt: string;
  updatedAt: string;
  category?: {
    id: string;
    name: string;
    icon?: string | null;
    color?: string | null;
  };
}

export interface CreateCalendarEventDTO {
  categoryId: string;
  title: string;
  description?: string;
  location?: string;
  startDateTime: string; // ISO datetime string
  endDateTime: string; // ISO datetime string
  isAllDay: boolean;
  reminderMinutes?: number;
  syncWithGoogle?: boolean;
}

export interface UpdateCalendarEventDTO {
  title?: string;
  description?: string | null;
  categoryId?: string;
  location?: string | null;
  startDateTime?: string; // ISO datetime string
  endDateTime?: string; // ISO datetime string
  isAllDay?: boolean;
  reminderMinutes?: number | null;
  status?: EventStatus;
}
