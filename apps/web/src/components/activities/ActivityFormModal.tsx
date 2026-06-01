import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { activitySchema, type ActivityFormValues } from '@/schemas/activitySchema';
import { useAllActivities } from '@/hooks/useActivities';
import { NoteEditor } from '@/components/resources/NoteEditor';
import type { Activity } from '@horus/shared';

interface ActivityFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ActivityFormValues) => void;
  initial?: Activity;
  isLoading?: boolean;
}

const WEEK_DAYS = [
  { label: 'D', value: 0 },
  { label: 'L', value: 1 },
  { label: 'M', value: 2 },
  { label: 'X', value: 3 },
  { label: 'J', value: 4 },
  { label: 'V', value: 5 },
  { label: 'S', value: 6 },
];

export function ActivityFormModal({
  isOpen,
  onClose,
  onSubmit,
  initial,
  isLoading,
}: ActivityFormModalProps) {
  const [showDetail, setShowDetail] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ActivityFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(activitySchema) as any,
    defaultValues: {
      name: '',
      description: '',
      content: '',
      periodicity: 'DAILY',
      weekDays: [],
      timesPerMonth: null,
      timeMode: 'FIXED',
      fixedHour: null,
      fixedMinute: null,
      afterActivityId: null,
      durationMinutes: null,
      emoji: '',
      color: '',
      order: 0,
    },
  });

  const { data: allActivities } = useAllActivities();

  const periodicity = watch('periodicity');
  const timeMode = watch('timeMode');
  const weekDays = watch('weekDays');

  useEffect(() => {
    if (initial) {
      reset({
        name: initial.name,
        description: initial.description ?? '',
        content: initial.content ?? '',
        periodicity: initial.periodicity,
        weekDays: initial.weekDays,
        timesPerMonth: initial.timesPerMonth ?? null,
        timeMode: initial.timeMode,
        fixedHour: initial.fixedHour ?? null,
        fixedMinute: initial.fixedMinute ?? null,
        afterActivityId: initial.afterActivityId ?? null,
        durationMinutes: initial.durationMinutes ?? null,
        emoji: initial.emoji ?? '',
        color: initial.color ?? '',
        order: initial.order,
      });
    } else {
      reset({
        name: '',
        description: '',
        content: '',
        periodicity: 'DAILY',
        weekDays: [],
        timesPerMonth: null,
        timeMode: 'FIXED',
        fixedHour: null,
        fixedMinute: null,
        afterActivityId: null,
        durationMinutes: null,
        emoji: '',
        color: '',
        order: 0,
      });
    }
    setShowDetail(false);
  }, [initial, reset, isOpen]);

  if (!isOpen) return null;

  const toggleWeekDay = (day: number) => {
    const current = weekDays ?? [];
    if (current.includes(day)) {
      setValue(
        'weekDays',
        current.filter((d) => d !== day)
      );
    } else {
      setValue(
        'weekDays',
        [...current, day].sort((a, b) => a - b)
      );
    }
  };

  const inputClass =
    'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow';

  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg font-semibold text-gray-900">
              {initial ? 'Editar actividad' : 'Nueva actividad'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
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

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4 max-h-[70vh] overflow-y-auto pr-1"
          >
            {/* Nombre */}
            <div>
              <label className={labelClass}>Nombre *</label>
              <input {...register('name')} className={inputClass} placeholder="Ej: Meditación" />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            {/* Descripción */}
            <div>
              <label className={labelClass}>Descripción (tagline)</label>
              <input
                {...register('description')}
                maxLength={500}
                className={inputClass}
                placeholder="Una línea corta que describe la actividad"
              />
            </div>

            {/* Detalle colapsable */}
            <div>
              <button
                type="button"
                onClick={() => setShowDetail((v) => !v)}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                {showDetail ? '▾ Ocultar detalle' : '▸ Agregar detalle (markdown)'}
              </button>
              {showDetail && (
                <div className="mt-2 border border-gray-300 rounded-lg overflow-hidden">
                  <Controller
                    name="content"
                    control={control}
                    render={({ field }) => (
                      <NoteEditor
                        value={field.value ?? ''}
                        onChange={field.onChange}
                        placeholder="Explicación detallada, instrucciones, etc."
                      />
                    )}
                  />
                </div>
              )}
            </div>

            {/* Periodicidad */}
            <div>
              <label className={labelClass}>Periodicidad *</label>
              <div className="flex gap-2">
                {(['DAILY', 'WEEKLY', 'MONTHLY'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setValue('periodicity', p)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      periodicity === p
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-300 hover:text-indigo-600'
                    }`}
                  >
                    {p === 'DAILY' ? 'Diaria' : p === 'WEEKLY' ? 'Semanal' : 'Mensual'}
                  </button>
                ))}
              </div>

              {periodicity === 'WEEKLY' && (
                <div className="mt-3 flex gap-1.5">
                  {WEEK_DAYS.map((d) => (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => toggleWeekDay(d.value)}
                      className={`w-9 h-9 rounded-full text-sm font-semibold border transition-colors ${
                        (weekDays ?? []).includes(d.value)
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-300'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              )}
              {errors.weekDays && (
                <p className="text-red-500 text-xs mt-1">{errors.weekDays.message}</p>
              )}

              {periodicity === 'MONTHLY' && (
                <div className="mt-3 flex items-center gap-2">
                  <label className="text-sm text-gray-600 whitespace-nowrap">Veces al mes:</label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    {...register('timesPerMonth', { valueAsNumber: true })}
                    className="w-20 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  {errors.timesPerMonth && (
                    <p className="text-red-500 text-xs">{errors.timesPerMonth.message}</p>
                  )}
                </div>
              )}
            </div>

            {/* Horario */}
            <div>
              <label className={labelClass}>Horario</label>
              <div className="flex gap-2 mb-3">
                {(['FIXED', 'AFTER_ACTIVITY'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setValue('timeMode', m)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      timeMode === m
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-300 hover:text-indigo-600'
                    }`}
                  >
                    {m === 'FIXED' ? 'Hora fija' : 'Después de...'}
                  </button>
                ))}
              </div>

              {timeMode === 'FIXED' && (
                <div className="flex items-center gap-2">
                  <select
                    {...register('fixedHour', { valueAsNumber: true })}
                    className="border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">HH</option>
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>
                        {String(i).padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                  <span className="text-gray-400 font-medium">:</span>
                  <select
                    {...register('fixedMinute', { valueAsNumber: true })}
                    className="border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">MM</option>
                    {[0, 15, 30, 45].map((m) => (
                      <option key={m} value={m}>
                        {String(m).padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                  {errors.fixedHour && (
                    <p className="text-red-500 text-xs">{errors.fixedHour.message}</p>
                  )}
                </div>
              )}

              {timeMode === 'AFTER_ACTIVITY' && (
                <div>
                  <select {...register('afterActivityId')} className={inputClass}>
                    <option value="">Seleccionar actividad previa...</option>
                    {allActivities
                      ?.filter((a) => a.id !== initial?.id)
                      .map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.emoji} {a.name}
                        </option>
                      ))}
                  </select>
                  {errors.afterActivityId && (
                    <p className="text-red-500 text-xs mt-1">{errors.afterActivityId.message}</p>
                  )}
                </div>
              )}
            </div>

            {/* Extras */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Duración (min)
                </label>
                <input
                  type="number"
                  min={1}
                  {...register('durationMinutes', { valueAsNumber: true })}
                  className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Emoji</label>
                <input
                  {...register('emoji')}
                  maxLength={10}
                  className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="🧘"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Color</label>
                <input
                  type="color"
                  {...register('color')}
                  className="w-full h-9 border border-gray-300 rounded-lg cursor-pointer px-1 py-0.5"
                />
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-5 mt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              onClick={handleSubmit(onSubmit)}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Guardando...' : initial ? 'Actualizar' : 'Crear actividad'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
