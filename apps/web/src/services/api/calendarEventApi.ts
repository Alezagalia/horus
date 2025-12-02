/**
 * Calendar Events API Service
 * Sprint 13 - US-117
 */

import { axiosInstance } from '@/lib/axios';
import type { CalendarEvent, CreateCalendarEventDTO, UpdateCalendarEventDTO } from '@horus/shared';

export interface GetCalendarEventsFilters {
  from?: string; // ISO datetime
  to?: string; // ISO datetime
  categoryId?: string;
}

// Backend Event type (with startDateTime/endDateTime)
interface BackendEvent {
  id: string;
  userId: string;
  categoryId: string;
  title: string;
  description?: string | null;
  location?: string | null;
  startDateTime: string;
  endDateTime: string;
  isAllDay: boolean;
  isRecurring: boolean;
  rrule?: string | null;
  recurringEventId?: string | null;
  status: 'pendiente' | 'completado' | 'cancelado';
  completedAt?: string | null;
  canceledAt?: string | null;
  archivedAt?: string | null;
  syncWithGoogle: boolean;
  googleEventId?: string | null;
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

// Transform backend event to frontend CalendarEvent
function transformBackendEvent(event: BackendEvent): CalendarEvent {
  return {
    ...event,
    date: event.startDateTime, // Use startDateTime as the main date
    source: event.googleEventId ? 'google_calendar' : 'horus',
  };
}

/**
 * Get calendar events with optional filters
 */
export async function getCalendarEvents(
  filters?: GetCalendarEventsFilters
): Promise<CalendarEvent[]> {
  const params = new URLSearchParams();
  if (filters?.from) params.append('from', filters.from);
  if (filters?.to) params.append('to', filters.to);
  if (filters?.categoryId) params.append('categoryId', filters.categoryId);

  const response = await axiosInstance.get<{ events: BackendEvent[] }>(`/events?${params.toString()}`);
  return response.data.events.map(transformBackendEvent);
}

/**
 * Get calendar event by ID
 */
export async function getCalendarEventById(id: string): Promise<CalendarEvent> {
  const response = await axiosInstance.get<{ event: BackendEvent }>(`/events/${id}`);
  return transformBackendEvent(response.data.event);
}

/**
 * Create new calendar event
 */
export async function createCalendarEvent(data: CreateCalendarEventDTO): Promise<CalendarEvent> {
  // Transform to backend format - now using startDateTime and endDateTime directly
  const backendData = {
    categoryId: data.categoryId,
    title: data.title,
    description: data.description,
    location: data.location,
    startDateTime: data.startDateTime,
    endDateTime: data.endDateTime,
    isAllDay: data.isAllDay,
    isRecurring: false,
    reminderMinutes: data.reminderMinutes,
    syncWithGoogle: data.syncWithGoogle ?? true,
  };

  const response = await axiosInstance.post<{ event: BackendEvent }>('/events', backendData);
  return transformBackendEvent(response.data.event);
}

/**
 * Update calendar event
 */
export async function updateCalendarEvent(
  id: string,
  data: UpdateCalendarEventDTO
): Promise<CalendarEvent> {
  // Transform to backend format - now using startDateTime and endDateTime directly
  const backendData: {
    title?: string;
    description?: string | null;
    categoryId?: string;
    location?: string | null;
    reminderMinutes?: number | null;
    status?: 'pendiente' | 'completado' | 'cancelado';
    startDateTime?: string;
    endDateTime?: string;
    isAllDay?: boolean;
  } = {
    title: data.title,
    description: data.description,
    categoryId: data.categoryId,
    location: data.location,
    reminderMinutes: data.reminderMinutes,
    status: data.status,
  };

  if (data.startDateTime) {
    backendData.startDateTime = data.startDateTime;
  }

  if (data.endDateTime) {
    backendData.endDateTime = data.endDateTime;
  }

  if (data.isAllDay !== undefined) {
    backendData.isAllDay = data.isAllDay;
  }

  const response = await axiosInstance.put<{ event: BackendEvent }>(`/events/${id}`, backendData);
  return transformBackendEvent(response.data.event);
}

/**
 * Delete calendar event
 */
export async function deleteCalendarEvent(id: string): Promise<void> {
  await axiosInstance.delete(`/events/${id}`);
}
