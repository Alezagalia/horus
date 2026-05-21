/**
 * Budget Form Modal
 * F-01 - Presupuestos Mensuales por Categoría
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Budget } from '@horus/shared';
import { useCategories } from '@/hooks/useCategories';

const CURRENCIES = ['ARS', 'USD', 'EUR', 'BRL', 'CLP', 'COP', 'MXN', 'UYU', 'PEN', 'GBP'] as const;

const formSchema = z.object({
  categoryId: z.string().min(1, 'Seleccioná una categoría'),
  amount: z.coerce.number().positive('El monto debe ser mayor a 0'),
  currency: z.string().min(1, 'Seleccioná una moneda'),
});

type FormData = z.infer<typeof formSchema>;

interface BudgetFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => void;
  editingBudget?: Budget | null;
  isLoading?: boolean;
}

export function BudgetFormModal({
  isOpen,
  onClose,
  onSubmit,
  editingBudget,
  isLoading,
}: BudgetFormModalProps) {
  const { data: categoriesData } = useCategories({ scope: 'gastos' });
  const categories = (categoriesData ?? []).filter((c) => c.isActive);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { categoryId: '', amount: 0, currency: 'ARS' },
  });

  useEffect(() => {
    if (!isOpen) return;
    if (editingBudget) {
      reset({
        categoryId: editingBudget.categoryId,
        amount: editingBudget.amount,
        currency: editingBudget.currency,
      });
    } else {
      reset({ categoryId: '', amount: 0, currency: 'ARS' });
    }
  }, [isOpen, editingBudget, reset]);

  if (!isOpen) return null;

  const isEditing = !!editingBudget;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-xl">
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditing ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}
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

          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
              <select
                {...register('categoryId')}
                disabled={isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-500"
              >
                <option value="">Seleccionar categoría…</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon ? `${cat.icon} ` : ''}
                    {cat.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && (
                <p className="mt-1 text-sm text-red-600">{errors.categoryId.message}</p>
              )}
              {isEditing && (
                <p className="mt-1 text-xs text-gray-400">La categoría no puede modificarse.</p>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monto *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                {...register('amount')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="10000"
              />
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
              )}
            </div>

            {/* Currency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Moneda *</label>
              <select
                {...register('currency')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {errors.currency && (
                <p className="mt-1 text-sm text-red-600">{errors.currency.message}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {isLoading ? 'Guardando…' : isEditing ? 'Guardar cambios' : 'Crear presupuesto'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
