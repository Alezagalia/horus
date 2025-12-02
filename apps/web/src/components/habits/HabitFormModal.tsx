/**
 * Habit Form Modal Component
 * Sprint 11 - US-099
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import type { Habit, Category, HabitFormData } from '@/types/habits';
import { habitSchema, type HabitFormSchema } from '@/schemas/habitSchema';

interface HabitFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: HabitFormData) => void;
  categories: Category[];
  editingHabit?: Habit | null;
  isSubmitting?: boolean;
}

const weekDayOptions = [
  { value: 0, label: 'D' },
  { value: 1, label: 'L' },
  { value: 2, label: 'M' },
  { value: 3, label: 'X' },
  { value: 4, label: 'J' },
  { value: 5, label: 'V' },
  { value: 6, label: 'S' },
];

export function HabitFormModal({
  isOpen,
  onClose,
  onSubmit,
  categories,
  editingHabit,
  isSubmitting = false,
}: HabitFormModalProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<HabitFormSchema>({
    resolver: zodResolver(habitSchema),
    defaultValues: {
      name: '',
      description: '',
      categoryId: '',
      type: 'CHECK',
      targetValue: undefined,
      unit: '',
      periodicity: 'DAILY',
      weekDays: [],
      timeOfDay: 'ANYTIME',
      color: undefined,
    },
    mode: 'onChange',
  });

  const watchType = watch('type');
  const watchPeriodicity = watch('periodicity');
  const watchWeekDays = watch('weekDays');

  // Load editing habit data
  useEffect(() => {
    if (editingHabit) {
      reset({
        name: editingHabit.name,
        description: editingHabit.description || '',
        categoryId: editingHabit.categoryId,
        type: editingHabit.type,
        targetValue: editingHabit.targetValue,
        unit: editingHabit.unit || '',
        periodicity: editingHabit.periodicity,
        weekDays: editingHabit.weekDays || [],
        timeOfDay: editingHabit.timeOfDay,
        color: editingHabit.color || undefined,
      });
    } else {
      reset({
        name: '',
        description: '',
        categoryId: '',
        type: 'CHECK',
        targetValue: undefined,
        unit: '',
        periodicity: 'DAILY',
        weekDays: [],
        timeOfDay: 'ANYTIME',
        color: undefined,
      });
    }
  }, [editingHabit, reset]);

  const handleFormSubmit = (data: HabitFormSchema) => {
    onSubmit(data as HabitFormData);
    // Toast y onClose se manejan en el componente padre después del success de la mutation
  };

  const handleWeekDayToggle = (day: number) => {
    const current = watchWeekDays || [];
    const newDays = current.includes(day) ? current.filter((d) => d !== day) : [...current, day];
    setValue('weekDays', newDays, { shouldValidate: true });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {editingHabit ? 'Editar Hábito' : 'Crear Nuevo Hábito'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
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
          <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-6">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del hábito *
              </label>
              <input
                id="name"
                type="text"
                {...register('name')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Ej: Meditar 10 minutos"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
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
                placeholder="Describe tu hábito..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

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
                <option value="">Selecciona una categoría</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && (
                <p className="mt-1 text-sm text-red-600">{errors.categoryId.message}</p>
              )}
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo *</label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    {...register('type')}
                    value="CHECK"
                    className="mr-2 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm">Marcar (Sí/No)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    {...register('type')}
                    value="NUMERIC"
                    className="mr-2 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm">Numérico</span>
                </label>
              </div>
              {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>}
            </div>

            {/* Target Value & Unit (only for NUMERIC) */}
            {watchType === 'NUMERIC' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="targetValue"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Valor objetivo *
                  </label>
                  <input
                    id="targetValue"
                    type="number"
                    {...register('targetValue', { valueAsNumber: true })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Ej: 8"
                  />
                  {errors.targetValue && (
                    <p className="mt-1 text-sm text-red-600">{errors.targetValue.message}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-1">
                    Unidad *
                  </label>
                  <input
                    id="unit"
                    type="text"
                    {...register('unit')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Ej: vasos, páginas"
                  />
                  {errors.unit && (
                    <p className="mt-1 text-sm text-red-600">{errors.unit.message}</p>
                  )}
                </div>
              </div>
            )}

            {/* Periodicity */}
            <div>
              <label htmlFor="periodicity" className="block text-sm font-medium text-gray-700 mb-1">
                Periodicidad *
              </label>
              <select
                id="periodicity"
                {...register('periodicity')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="DAILY">Diario</option>
                <option value="WEEKLY">Semanal</option>
                <option value="MONTHLY">Mensual</option>
                <option value="CUSTOM">Personalizado</option>
              </select>
              {errors.periodicity && (
                <p className="mt-1 text-sm text-red-600">{errors.periodicity.message}</p>
              )}
            </div>

            {/* Week Days (only for WEEKLY) */}
            {watchPeriodicity === 'WEEKLY' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Días de la semana *
                </label>
                <div className="flex gap-2">
                  {weekDayOptions.map((day) => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => handleWeekDayToggle(day.value)}
                      className={`w-10 h-10 rounded-full font-medium text-sm transition-colors ${
                        (watchWeekDays || []).includes(day.value)
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
                {errors.weekDays && (
                  <p className="mt-1 text-sm text-red-600">{errors.weekDays.message}</p>
                )}
              </div>
            )}

            {/* Time of Day */}
            <div>
              <label htmlFor="timeOfDay" className="block text-sm font-medium text-gray-700 mb-1">
                Momento del día *
              </label>
              <select
                id="timeOfDay"
                {...register('timeOfDay')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="AYUNO">🍽️ En ayuno</option>
                <option value="MANANA">🌅 Mañana</option>
                <option value="MEDIA_MANANA">☕ Media mañana</option>
                <option value="TARDE">☀️ Tarde</option>
                <option value="MEDIA_TARDE">🍵 Media tarde</option>
                <option value="NOCHE">🌙 Noche</option>
                <option value="ANTES_DORMIR">🛏️ Antes de dormir</option>
                <option value="ANYTIME">⏰ Cualquier momento</option>
              </select>
              {errors.timeOfDay && (
                <p className="mt-1 text-sm text-red-600">{errors.timeOfDay.message}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Guardando...' : editingHabit ? 'Guardar cambios' : 'Crear hábito'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
