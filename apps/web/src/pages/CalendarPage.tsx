/**
 * Calendar Page
 * Sprint 13 - US-117
 */

import { useState, useMemo, useCallback } from 'react';
import { Calendar, momentLocalizer, View, SlotInfo } from 'react-big-calendar';
import withDragAndDrop, {
  EventInteractionArgs,
} from 'react-big-calendar/lib/addons/dragAndDrop';
import moment from 'moment';
import 'moment/locale/es';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import { Toaster } from 'react-hot-toast';
import type { CalendarEvent, CreateCalendarEventDTO } from '@horus/shared';
import { EventModal } from '@/components/calendar/EventModal';
import { EventFormModal } from '@/components/calendar/EventFormModal';
import { GoogleCalendarSyncModal } from '@/components/calendar/GoogleCalendarSyncModal';
import {
  useCalendarEvents,
  useCreateCalendarEvent,
  useUpdateCalendarEvent,
  useDeleteCalendarEvent,
} from '@/hooks/useCalendarEvents';
import { useTasks } from '@/hooks/useTasks';
import type { Task } from '@/types/tasks';
import { startOfMonth, endOfMonth } from 'date-fns';

// Configure moment and localizer
moment.locale('es');
const localizer = momentLocalizer(moment);

// Create drag and drop calendar
const DnDCalendar = withDragAndDrop(Calendar);

// Messages in Spanish
const messages = {
  allDay: 'Todo el día',
  previous: 'Anterior',
  next: 'Siguiente',
  today: 'Hoy',
  month: 'Mes',
  week: 'Semana',
  day: 'Día',
  agenda: 'Agenda',
  date: 'Fecha',
  time: 'Hora',
  event: 'Evento',
  noEventsInRange: 'No hay eventos en este rango',
  showMore: (total: number) => `+ Ver más (${total})`,
};

export function CalendarPage() {
  // State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<View>('month');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<CalendarEvent | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [isGoogleSyncModalOpen, setIsGoogleSyncModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Calculate date range for fetching events
  const dateRange = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return {
      from: start.toISOString(),
      to: end.toISOString(),
    };
  }, [currentDate]);

  // Fetch events
  const { data: events = [], isLoading: isLoadingEvents } = useCalendarEvents(dateRange);

  // Fetch tasks (only those with due date)
  const { data: tasks = [], isLoading: isLoadingTasks } = useTasks();

  const isLoading = isLoadingEvents || isLoadingTasks;

  // Mutations
  const createEventMutation = useCreateCalendarEvent();
  const updateEventMutation = useUpdateCalendarEvent();
  const deleteEventMutation = useDeleteCalendarEvent();

  // Transform events and tasks for react-big-calendar
  const calendarEvents = useMemo(() => {
    // Map calendar events
    const eventItems = events.map((event) => {
      // Use startDateTime/endDateTime if available, fallback to date
      const startDate = event.startDateTime
        ? new Date(event.startDateTime)
        : new Date(event.date);
      const endDate = event.endDateTime ? new Date(event.endDateTime) : new Date(event.date);

      return {
        ...event,
        start: startDate,
        end: endDate,
        title: event.title,
        type: 'event' as const,
      };
    });

    // Map tasks with due date
    const taskItems = tasks
      .filter((task) => task.dueDate) // Only tasks with due date
      .map((task) => {
        // Extract date components from ISO string to avoid timezone issues
        const [datePart] = task.dueDate!.split('T');
        const [year, month, day] = datePart.split('-').map(Number);
        const dueDate = new Date(year, month - 1, day, 12, 0, 0); // Noon to avoid timezone shifts

        return {
          ...task,
          start: dueDate,
          end: dueDate,
          title: task.title,
          type: 'task' as const,
        };
      });

    return [...eventItems, ...taskItems];
  }, [events, tasks]);

  // Handlers
  const handleNavigate = useCallback((newDate: Date) => {
    setCurrentDate(newDate);
  }, []);

  const handleViewChange = useCallback((newView: View) => {
    setView(newView);
  }, []);

  const handleSelectEvent = useCallback((event: any) => {
    if (event.type === 'task') {
      // It's a task - show task details
      setSelectedTask(event as Task);
    } else {
      // It's an event - show event details
      setSelectedEvent(event as CalendarEvent);
    }
  }, []);

  const handleSelectSlot = useCallback((slotInfo: SlotInfo) => {
    setSelectedSlot(slotInfo.start);
    setEditingEvent(null);
    setIsFormModalOpen(true);
  }, []);

  const handleCreateEvent = () => {
    setSelectedSlot(null);
    setEditingEvent(null);
    setIsFormModalOpen(true);
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setSelectedEvent(null);
    setEditingEvent(event);
    setIsFormModalOpen(true);
  };

  const handleDeleteEvent = (event: CalendarEvent) => {
    setSelectedEvent(null);
    setDeletingEvent(event);
  };

  const confirmDelete = () => {
    if (deletingEvent) {
      deleteEventMutation.mutate(deletingEvent.id, {
        onSuccess: () => {
          setDeletingEvent(null);
        },
      });
    }
  };

  const handleSubmitForm = (data: CreateCalendarEventDTO) => {
    if (editingEvent) {
      // Edit
      updateEventMutation.mutate(
        {
          id: editingEvent.id,
          data: {
            title: data.title,
            description: data.description,
            startDateTime: data.startDateTime,
            endDateTime: data.endDateTime,
            isAllDay: data.isAllDay,
            categoryId: data.categoryId,
            location: data.location,
          },
        },
        {
          onSuccess: () => {
            setIsFormModalOpen(false);
            setEditingEvent(null);
            setSelectedSlot(null);
          },
        }
      );
    } else {
      // Create
      createEventMutation.mutate(data, {
        onSuccess: () => {
          setIsFormModalOpen(false);
          setSelectedSlot(null);
        },
      });
    }
  };

  const handleToday = useCallback(() => {
    // Navigate to today and switch to day view
    const today = new Date();
    setCurrentDate(today);
    setView('day');
  }, []);

  // Handle drag and drop of events
  const handleEventDrop = useCallback(
    ({ event, start, end }: EventInteractionArgs<any>) => {
      // Only allow dragging calendar events, not tasks
      if (event.type === 'task') {
        return;
      }

      // Update the event with new dates
      updateEventMutation.mutate({
        id: event.id,
        data: {
          startDateTime: (start as Date).toISOString(),
          endDateTime: (end as Date).toISOString(),
        },
      });
    },
    [updateEventMutation]
  );

  // Handle resize of events
  const handleEventResize = useCallback(
    ({ event, start, end }: EventInteractionArgs<any>) => {
      // Only allow resizing calendar events, not tasks
      if (event.type === 'task') {
        return;
      }

      // Update the event with new dates
      updateEventMutation.mutate({
        id: event.id,
        data: {
          startDateTime: (start as Date).toISOString(),
          endDateTime: (end as Date).toISOString(),
        },
      });
    },
    [updateEventMutation]
  );

  // Determine if an event can be dragged
  const draggableAccessor = useCallback((event: any) => {
    // Only calendar events can be dragged, not tasks
    return event.type !== 'task';
  }, []);

  // Event style getter - distinguish Google events and tasks
  const eventStyleGetter = (event: any) => {
    const isGoogleEvent = event.source === 'google_calendar';
    const isTask = event.type === 'task';

    let backgroundColor = event.category?.color || '#3B82F6';
    let border = 'none';

    if (isTask) {
      // Task colors based on priority and completion status
      if (event.completedAt) {
        backgroundColor = '#9CA3AF'; // Gray for completed
      } else if (event.priority === 'alta') {
        backgroundColor = '#EF4444'; // Red for high priority
      } else if (event.priority === 'media') {
        backgroundColor = '#F59E0B'; // Amber for medium priority
      } else {
        backgroundColor = '#10B981'; // Green for low priority
      }
      border = '2px dashed rgba(255,255,255,0.5)';
    } else if (isGoogleEvent) {
      backgroundColor = '#4285F4';
      border = '2px solid #1967D2';
    }

    const style: React.CSSProperties = {
      backgroundColor,
      borderRadius: '4px',
      opacity: isTask && event.completedAt ? 0.6 : 0.9,
      color: 'white',
      border,
      display: 'block',
      textDecoration: isTask && event.completedAt ? 'line-through' : 'none',
    };
    return { style };
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando calendario...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Toaster position="top-right" />

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Calendario</h1>
            <p className="text-gray-600 mt-1">Gestiona tus eventos y reuniones</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsGoogleSyncModalOpen(true)}
              className="p-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title="Integraciones"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>
            <button
              onClick={handleToday}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Hoy
            </button>
            <button
              onClick={handleCreateEvent}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Nuevo Evento
            </button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mb-4 flex flex-wrap items-center gap-4 text-sm text-gray-600">
        <span className="font-medium">Leyenda:</span>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-blue-500" />
          <span>Eventos</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-red-500 border border-dashed border-white" />
          <span>Tareas (Alta)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-amber-500 border border-dashed border-white" />
          <span>Tareas (Media)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-green-500 border border-dashed border-white" />
          <span>Tareas (Baja)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-gray-400" />
          <span>Completadas</span>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <div style={{ height: '700px' }}>
          {/* @ts-expect-error - react-big-calendar has type compatibility issues with React 18 */}
          <DnDCalendar
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            view={view}
            onView={handleViewChange}
            date={currentDate}
            onNavigate={handleNavigate}
            onSelectEvent={handleSelectEvent}
            onSelectSlot={handleSelectSlot}
            onEventDrop={handleEventDrop}
            onEventResize={handleEventResize}
            draggableAccessor={draggableAccessor}
            resizable
            selectable
            eventPropGetter={eventStyleGetter}
            messages={messages}
            culture="es"
          />
        </div>
      </div>

      {/* Event Detail Modal */}
      <EventModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onEdit={handleEditEvent}
        onDelete={handleDeleteEvent}
      />

      {/* Event Form Modal */}
      <EventFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingEvent(null);
          setSelectedSlot(null);
        }}
        onSubmit={handleSubmitForm}
        editingEvent={editingEvent}
        initialDate={selectedSlot || undefined}
      />

      {/* Delete Confirmation Modal */}
      {deletingEvent && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setDeletingEvent(null)}
          />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Eliminar evento</h3>
              <p className="text-gray-600 mb-4">
                ¿Estás seguro de que deseas eliminar el evento "{deletingEvent.title}"?
              </p>
              {deletingEvent.source === 'google_calendar' && (
                <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded mb-4">
                  ⚠️ Este evento proviene de Google Calendar. Eliminarlo aquí no lo eliminará de
                  Google Calendar.
                </p>
              )}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeletingEvent(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Google Calendar Sync Modal */}
      <GoogleCalendarSyncModal
        isOpen={isGoogleSyncModalOpen}
        onClose={() => setIsGoogleSyncModalOpen(false)}
      />

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setSelectedTask(null)}
          />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-3 h-3 rounded-full ${
                      selectedTask.completedAt
                        ? 'bg-gray-400'
                        : selectedTask.priority === 'alta'
                          ? 'bg-red-500'
                          : selectedTask.priority === 'media'
                            ? 'bg-amber-500'
                            : 'bg-green-500'
                    }`}
                  />
                  <span className="text-xs font-medium text-gray-500 uppercase">Tarea</span>
                </div>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <h3
                className={`text-lg font-semibold text-gray-900 mb-2 ${selectedTask.completedAt ? 'line-through text-gray-500' : ''}`}
              >
                {selectedTask.title}
              </h3>

              {selectedTask.description && (
                <p className="text-gray-600 text-sm mb-4">{selectedTask.description}</p>
              )}

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Prioridad:</span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      selectedTask.priority === 'alta'
                        ? 'bg-red-100 text-red-700'
                        : selectedTask.priority === 'media'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {selectedTask.priority === 'alta'
                      ? 'Alta'
                      : selectedTask.priority === 'media'
                        ? 'Media'
                        : 'Baja'}
                  </span>
                </div>

                {selectedTask.categoryName && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Categoría:</span>
                    <span>
                      {selectedTask.categoryIcon} {selectedTask.categoryName}
                    </span>
                  </div>
                )}

                {selectedTask.dueDate && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Vencimiento:</span>
                    <span>
                      {(() => {
                        const [datePart] = selectedTask.dueDate.split('T');
                        const [year, month, day] = datePart.split('-').map(Number);
                        const date = new Date(Date.UTC(year, month - 1, day));
                        return date.toLocaleDateString('es-ES', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          timeZone: 'UTC',
                        });
                      })()}
                    </span>
                  </div>
                )}

                {selectedTask.completedAt && (
                  <div className="flex items-center gap-2 text-green-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>Completada</span>
                  </div>
                )}

                {selectedTask.checklist.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Checklist:</span>
                    <span>
                      {selectedTask.checklist.filter((i) => i.completed).length}/
                      {selectedTask.checklist.length} items
                    </span>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => setSelectedTask(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cerrar
                </button>
                <a
                  href="/tasks"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                >
                  Ver en Tareas
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
