// Offline-first Fase 2c: los eventos se leen/escriben en WatermelonDB
// (src/db/eventQueries|eventWrites) y se replican vía /api/replication.
// Quedan acá solo los tipos que consume la UI.

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
