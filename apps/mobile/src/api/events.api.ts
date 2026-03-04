/**
 * Events API Client
 * Sprint 4 - Calendar Integration
 *
 * API client for calendar events endpoints
 */

// Sprint 1: Use centralized axios instance with auth interceptors
import { apiClient } from '../lib/axios';

export type EventStatus = 'pendiente' | 'completado' | 'cancelado';

export interface Event {
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
  parentEventId?: string | null;
  recurringInstanceDate?: string | null;
  reminderMinutes?: number | null;
  status: EventStatus;
  syncWithGoogle: boolean;
  googleEventId?: string | null;
  createdAt: string;
  updatedAt: string;
  // Populated fields
  category?: {
    id: string;
    name: string;
    icon?: string;
    color?: string;
  };
}

export interface GetEventsParams {
  from: string; // ISO datetime string
  to: string; // ISO datetime string
  categoryId?: string;
  status?: EventStatus;
}

export interface CreateEventDTO {
  categoryId: string;
  title: string;
  description?: string;
  location?: string;
  startDateTime: string; // ISO datetime string
  endDateTime: string; // ISO datetime string
  isAllDay?: boolean;
  isRecurring?: boolean;
  rrule?: string;
  reminderMinutes?: number;
  syncWithGoogle?: boolean;
}

export interface UpdateEventDTO {
  title?: string;
  description?: string | null;
  categoryId?: string;
  location?: string | null;
  startDateTime?: string;
  endDateTime?: string;
  isAllDay?: boolean;
  reminderMinutes?: number | null;
  status?: EventStatus;
}

/**
 * Get all events in a date range
 */
export const getEvents = async (params: GetEventsParams): Promise<Event[]> => {
  const queryParams = new URLSearchParams();
  queryParams.append('from', params.from);
  queryParams.append('to', params.to);
  if (params.categoryId) queryParams.append('categoryId', params.categoryId);
  if (params.status) queryParams.append('status', params.status);

  const response = await apiClient.get<{ events: Event[] }>(`/events?${queryParams.toString()}`);
  return response.data.events;
};

/**
 * Get upcoming events (next 7 days)
 */
export const getUpcomingEvents = async (limit: number = 10): Promise<Event[]> => {
  const now = new Date();
  const weekFromNow = new Date();
  weekFromNow.setDate(weekFromNow.getDate() + 7);

  return getEvents({
    from: now.toISOString(),
    to: weekFromNow.toISOString(),
    status: 'pendiente',
  }).then((events) => events.slice(0, limit));
};

/**
 * Get event by ID
 */
export const getEventById = async (id: string): Promise<Event> => {
  const response = await apiClient.get<{ event: Event }>(`/events/${id}`);
  return response.data.event;
};

/**
 * Create new event
 */
export const createEvent = async (data: CreateEventDTO): Promise<Event> => {
  const response = await apiClient.post<{ event: Event }>('/events', data);
  return response.data.event;
};

/**
 * Update existing event
 */
export const updateEvent = async (id: string, data: UpdateEventDTO): Promise<Event> => {
  const response = await apiClient.put<{ event: Event }>(`/events/${id}`, data);
  return response.data.event;
};

/**
 * Delete event
 */
export const deleteEvent = async (id: string): Promise<void> => {
  await apiClient.delete(`/events/${id}`);
};

/**
 * Update event status
 */
export const updateEventStatus = async (id: string, status: EventStatus): Promise<Event> => {
  return updateEvent(id, { status });
};
