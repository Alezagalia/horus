/**
 * Event Detail Modal Component
 * Sprint 13 - US-117
 */

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { CalendarEvent } from '@horus/shared';

interface EventModalProps {
  event: CalendarEvent | null;
  onClose: () => void;
  onEdit: (event: CalendarEvent) => void;
  onDelete: (event: CalendarEvent) => void;
}

export function EventModal({ event, onClose, onEdit, onDelete }: EventModalProps) {
  if (!event) return null;

  const eventDate = new Date(event.date);
  const dateFormat = event.isAllDay
    ? format(eventDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })
    : format(eventDate, "EEEE, d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-lg">
            <h2 className="text-xl font-semibold text-gray-900">{event.title}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Date & Time */}
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500">Fecha y hora</p>
                <p className="text-gray-900 capitalize">{dateFormat}</p>
                {event.isAllDay && (
                  <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                    Todo el día
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            {event.description && (
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h7"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500">Descripción</p>
                  <p className="text-gray-900 whitespace-pre-wrap">{event.description}</p>
                </div>
              </div>
            )}

            {/* Category */}
            {event.category && (
              <div className="flex items-start gap-3">
                <div
                  className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: event.category.color + '20' }}
                >
                  <span className="text-2xl">{event.category.icon}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500">Categoría</p>
                  <p className="text-gray-900">{event.category.name}</p>
                </div>
              </div>
            )}

            {/* Location */}
            {event.location && (
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500">Ubicación</p>
                  <p className="text-gray-900">{event.location}</p>
                </div>
              </div>
            )}

            {/* Origin */}
            {event.source && (
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500">Origen</p>
                  <p className="text-gray-900">
                    {event.source === 'google_calendar' ? 'Google Calendar' : 'Horus'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="border-t px-6 py-4">
            {event.source === 'google_calendar' ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                  ℹ️ Este evento proviene de Google Calendar y no puede editarse desde Horus. Usa
                  Google Calendar para modificarlo.
                </p>
                <div className="flex justify-end">
                  <button
                    onClick={() => onDelete(event)}
                    className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => onDelete(event)}
                  className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
                >
                  Eliminar
                </button>
                <button
                  onClick={() => onEdit(event)}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                >
                  Editar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
