/**
 * Recurring Expense Form Modal Component
 * Sprint 13 - US-122
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { RecurringExpense } from '@horus/shared';
import { useCategories } from '@/hooks/useCategories';

const formSchema = z.object({
  concept: z.string().min(1, 'Concepto requerido').max(100, 'Máximo 100 caracteres'),
  categoryId: z.string().min(1, 'Categoría requerida'),
  currency: z.enum(['ARS', 'USD', 'EUR', 'BRL'], { required_error: 'Moneda requerida' }),
  dueDay: z.number().int().min(1).max(31).nullable().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface RecurringExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => void;
  editingExpense: RecurringExpense | null;
}

const CURRENCIES = [
  { value: 'ARS', label: 'ARS - Peso Argentino' },
  { value: 'USD', label: 'USD - Dólar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'BRL', label: 'BRL - Real Brasileño' },
];

export function RecurringExpenseFormModal({
  isOpen,
  onClose,
  onSubmit,
  editingExpense,
}: RecurringExpenseFormModalProps) {
  const { data: categories = [] } = useCategories();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      concept: '',
      categoryId: '',
      currency: 'ARS',
      dueDay: null,
    },
  });

  const dueDayValue = watch('dueDay');

  // Reset form when modal opens/closes or editing changes
  useEffect(() => {
    if (editingExpense) {
      reset({
        concept: editingExpense.concept,
        categoryId: editingExpense.categoryId,
        currency: editingExpense.currency as 'ARS' | 'USD' | 'EUR' | 'BRL',
        dueDay: editingExpense.dueDay,
      });
    } else {
      reset({
        concept: '',
        categoryId: '',
        currency: 'ARS',
        dueDay: null,
      });
    }
  }, [editingExpense, reset, isOpen]);

  const handleFormSubmit = (data: FormData) => {
    onSubmit(data);
  };

  if (!isOpen) return null;

  // Filter categories for expenses (scope 'gastos')
  const expenseCategories = categories.filter((cat) => cat.scope === 'gastos');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-lg">
            <h2 className="text-xl font-semibold text-gray-900">
              {editingExpense ? 'Editar Plantilla' : 'Nueva Plantilla de Gasto Recurrente'}
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
          <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-6">
            {/* Info Note */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="flex-1">
                  <p className="text-sm text-blue-800">
                    {editingExpense
                      ? 'Editar esta plantilla NO afectará las instancias mensuales ya generadas.'
                      : 'El monto se ingresará cada mes al pagar el gasto. Las plantillas activas generarán automáticamente instancias mensuales.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Concept */}
            <div>
              <label htmlFor="concept" className="block text-sm font-medium text-gray-700 mb-1">
                Concepto *
              </label>
              <input
                id="concept"
                {...register('concept')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Ej: Alquiler, Netflix, Gimnasio..."
                maxLength={100}
              />
              {errors.concept && (
                <p className="mt-1 text-sm text-red-600">{errors.concept.message}</p>
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
                <option value="">Seleccionar categoría</option>
                {expenseCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && (
                <p className="mt-1 text-sm text-red-600">{errors.categoryId.message}</p>
              )}
            </div>

            {/* Currency */}
            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
                Moneda *
              </label>
              <select
                id="currency"
                {...register('currency')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {CURRENCIES.map((curr) => (
                  <option key={curr.value} value={curr.value}>
                    {curr.label}
                  </option>
                ))}
              </select>
              {errors.currency && (
                <p className="mt-1 text-sm text-red-600">{errors.currency.message}</p>
              )}
            </div>

            {/* Due Day */}
            <div>
              <label htmlFor="dueDay" className="block text-sm font-medium text-gray-700 mb-1">
                Día de vencimiento
              </label>
              <div className="flex items-center gap-3">
                <select
                  id="dueDay"
                  value={dueDayValue ?? ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setValue('dueDay', val === '' ? null : parseInt(val, 10));
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Sin vencimiento fijo</option>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                    <option key={day} value={day}>
                      Día {day}
                    </option>
                  ))}
                </select>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Opcional: El día del mes en que vence este gasto
              </p>
              {errors.dueDay && (
                <p className="mt-1 text-sm text-red-600">{errors.dueDay.message}</p>
              )}
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
                {editingExpense ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
