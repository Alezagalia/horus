import { addDays } from 'date-fns';
import { axiosInstance } from '../axios';

export interface UpcomingEvent {
  id: string;
  title: string;
  startDateTime: string;
  endDateTime: string;
  isAllDay: boolean;
  category?: { name: string; color: string; icon: string };
}

export interface CalendarEvent {
  id: string;
  title: string;
  startDateTime: string;
  endDateTime: string;
  isAllDay: boolean;
  status: 'pendiente' | 'completado' | 'cancelado';
  description?: string;
  location?: string;
  categoryId: string;
  category?: { id: string; name: string; icon?: string; color?: string };
  isRecurring: boolean;
  updatedAt: string;
}

export interface CreateEventDTO {
  title: string;
  startDateTime: string;
  endDateTime: string;
  isAllDay: boolean;
  categoryId: string;
  description?: string;
  location?: string;
}

export type UpdateEventDTO = Partial<CreateEventDTO> & { status?: string };

export const eventApi = {
  listUpcoming: async (days = 3): Promise<UpcomingEvent[]> => {
    const from = new Date().toISOString();
    const to = addDays(new Date(), days).toISOString();
    const { data } = await axiosInstance.get('/events', { params: { from, to } });
    return (data.events ?? data) as UpcomingEvent[];
  },

  list: async (from: string, to: string): Promise<CalendarEvent[]> => {
    const { data } = await axiosInstance.get(`/events`, { params: { from, to } });
    return (data.events ?? data) as CalendarEvent[];
  },

  getById: async (id: string): Promise<CalendarEvent> => {
    const { data } = await axiosInstance.get(`/events/${id}`);
    return data.event ?? data;
  },

  create: async (dto: CreateEventDTO): Promise<CalendarEvent> => {
    const { data } = await axiosInstance.post('/events', dto);
    return data.event ?? data;
  },

  update: async (id: string, dto: UpdateEventDTO): Promise<CalendarEvent> => {
    const { data } = await axiosInstance.put(`/events/${id}`, dto);
    return data.event ?? data;
  },

  del: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/events/${id}`);
  },
};
