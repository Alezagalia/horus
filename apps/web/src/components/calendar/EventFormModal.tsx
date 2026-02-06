/**
 * Event Form Modal Component (Create/Edit)
 * Sprint 13 - US-117
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Scope } from '@horus/shared';
import type { CalendarEvent, CreateCalendarEventDTO } from '@horus/shared';
import { useCategories } from '@/hooks/useCategories';

const formSchema = z
  .object({
    title: z.string().min(1, 'Título requerido').max(100, 'Máximo 100 caracteres'),
    description: z.string().optional(),
    date: z.string().min(1, 'Fecha requerida'),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    isAllDay: z.boolean(),
    categoryId: z.string().min(1, 'Categoría requerida'),
    location: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.isAllDay) return true;
      if (!data.startTime || !data.endTime) return true;
      return data.endTime > data.startTime;
    },
    {
      message: 'La hora de fin debe ser posterior a la hora de inicio',
      path: ['endTime'],
    }
  );

type FormData = z.infer<typeof formSchema>;

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCalendarEventDTO) => void;
  editingEvent?: CalendarEvent | null;
  initialDate?: Date;
}

export function EventFormModal({
  isOpen,
  onClose,
  onSubmit,
  editingEvent,
  initialDate,
}: EventFormModalProps) {
  const { data: categories = [] } = useCategories({ scope: Scope.EVENTOS });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      date: initialDate
        ? initialDate.toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '10:00',
      isAllDay: false,
      categoryId: '',
      location: '',
    },
  });

  const isAllDay = watch('isAllDay');

  // Reset form when modal opens or editingEvent changes
  useEffect(() => {
    if (!isOpen) return; // Only reset when modal is open

    if (editingEvent) {
      // Extraer fecha y hora de inicio/fin
      const startDate = new Date(editingEvent.startDateTime);
      const endDate = new Date(editingEvent.endDateTime);

      reset({
        title: editingEvent.title,
        description: editingEvent.description || '',
        date: startDate.toISOString().split('T')[0],
        startTime: editingEvent.isAllDay ? '09:00' : startDate.toTimeString().slice(0, 5),
        endTime: editingEvent.isAllDay ? '10:00' : endDate.toTimeString().slice(0, 5),
        isAllDay: editingEvent.isAllDay,
        categoryId: editingEvent.categoryId || '',
        location: editingEvent.location || '',
      });
    } else {
      reset({
        title: '',
        description: '',
        date: initialDate
          ? initialDate.toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '10:00',
        isAllDay: false,
        categoryId: '',
        location: '',
      });
    }
  }, [isOpen, editingEvent, initialDate, reset]);

  const handleFormSubmit = (data: FormData) => {
    // Construir startDateTime y endDateTime
    // Asegurarse de que la fecha esté en formato YYYY-MM-DD
    const dateStr = data.date;

    let startDateTimeStr: string;
    let endDateTimeStr: string;

    if (data.isAllDay) {
      // Para eventos de todo el día, usar 00:00 y 23:59 en hora local
      const [year, month, day] = dateStr.split('-').map(Number);
      const startDate = new Date(year, month - 1, day, 0, 0, 0);
      const endDate = new Date(year, month - 1, day, 23, 59, 59);
      startDateTimeStr = startDate.toISOString();
      endDateTimeStr = endDate.toISOString();
    } else {
      // Usar las horas especificadas en hora local
      const startTime = data.startTime || '09:00';
      const endTime = data.endTime || '10:00';

      const [year, month, day] = dateStr.split('-').map(Number);
      const [startHour, startMinute] = startTime.split(':').map(Number);
      const [endHour, endMinute] = endTime.split(':').map(Number);

      const startDate = new Date(year, month - 1, day, startHour, startMinute, 0);
      const endDate = new Date(year, month - 1, day, endHour, endMinute, 0);

      startDateTimeStr = startDate.toISOString();
      endDateTimeStr = endDate.toISOString();
    }

    const submitData: CreateCalendarEventDTO = {
      title: data.title,
      description: data.description,
      startDateTime: startDateTimeStr,
      endDateTime: endDateTimeStr,
      isAllDay: data.isAllDay,
      categoryId: data.categoryId,
      location: data.location || undefined,
    };

    onSubmit(submitData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-lg">
            <h2 className="text-xl font-semibold text-gray-900">
              {editingEvent ? 'Editar Evento' : 'Nuevo Evento'}
            </h2>
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

          {/* Form */}
          <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-4">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Título *
              </label>
              <input
                id="title"
                {...register('title')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Reunión de equipo"
                maxLength={100}
              />
              {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                id="description"
                {...register('description')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Detalles del evento..."
              />
            </div>

            {/* Date */}
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                Fecha *
              </label>
              <input
                id="date"
                type="date"
                {...register('date')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>}
            </div>

            {/* All Day Checkbox */}
            <div>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('isAllDay')}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                Todo el día
              </label>
            </div>

            {/* Start Time & End Time (only if not all-day) */}
            {!isAllDay && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="startTime"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Hora de inicio *
                  </label>
                  <input
                    id="startTime"
                    type="time"
                    {...register('startTime')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">
                    Hora de fin *
                  </label>
                  <input
                    id="endTime"
                    type="time"
                    {...register('endTime')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {errors.endTime && (
                    <p className="mt-1 text-sm text-red-600">{errors.endTime.message}</p>
                  )}
                </div>
              </div>
            )}

            {/* Category */}
            <div>
              <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-1">
                Categoría *
              </label>
              <select
                id="categoryId"
                {...register('categoryId')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Seleccionar categoría</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && (
                <p className="mt-1 text-sm text-red-600">{errors.categoryId.message}</p>
              )}
            </div>

            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                Ubicación
              </label>
              <input
                id="location"
                {...register('location')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Sala de conferencias A"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
              >
                {editingEvent ? 'Guardar cambios' : 'Crear evento'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
