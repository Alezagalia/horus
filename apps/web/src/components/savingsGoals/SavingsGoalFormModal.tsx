/**
 * SavingsGoalFormModal
 * Create / Edit a savings goal.
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { SavingsGoalWithProgress } from '@horus/shared';
import { useAccounts } from '@/hooks/useAccounts';

const formSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(200),
  accountId: z.string().min(1, 'Seleccioná una cuenta'),
  targetAmount: z.coerce.number().positive('El monto objetivo debe ser mayor a 0'),
  targetDate: z.string().optional(),
  notes: z.string().max(2000).optional(),
});

type FormData = z.infer<typeof formSchema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => void;
  editingGoal?: SavingsGoalWithProgress | null;
  isLoading?: boolean;
}

export function SavingsGoalFormModal({ isOpen, onClose, onSubmit, editingGoal, isLoading }: Props) {
  const { data: accountsData } = useAccounts();
  const accounts = (accountsData ?? []).filter((a) => a.isActive);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', accountId: '', targetAmount: 0, targetDate: '', notes: '' },
  });

  useEffect(() => {
    if (!isOpen) return;
    if (editingGoal) {
      reset({
        name: editingGoal.name,
        accountId: editingGoal.accountId,
        targetAmount: editingGoal.targetAmount,
        targetDate: editingGoal.targetDate
          ? new Date(editingGoal.targetDate).toISOString().split('T')[0]
          : '',
        notes: editingGoal.notes ?? '',
      });
    } else {
      reset({ name: '', accountId: '', targetAmount: 0, targetDate: '', notes: '' });
    }
  }, [isOpen, editingGoal, reset]);

  if (!isOpen) return null;

  const isEditing = !!editingGoal;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-xl">
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditing ? 'Editar meta de ahorro' : 'Nueva meta de ahorro'}
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
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input
                type="text"
                {...register('name')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Ej: Fondo de emergencia"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
            </div>

            {/* Account */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cuenta vinculada *
              </label>
              <select
                {...register('accountId')}
                disabled={isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-500"
              >
                <option value="">Seleccionar cuenta…</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.icon} {acc.name} ({acc.currency})
                  </option>
                ))}
              </select>
              {errors.accountId && (
                <p className="mt-1 text-sm text-red-600">{errors.accountId.message}</p>
              )}
              {isEditing && (
                <p className="mt-1 text-xs text-gray-400">La cuenta no puede modificarse.</p>
              )}
            </div>

            {/* Target amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monto objetivo *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                {...register('targetAmount')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="50000"
              />
              {errors.targetAmount && (
                <p className="mt-1 text-sm text-red-600">{errors.targetAmount.message}</p>
              )}
            </div>

            {/* Target date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha límite</label>
              <input
                type="date"
                {...register('targetDate')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
              <textarea
                {...register('notes')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                placeholder="Notas opcionales sobre esta meta…"
              />
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
                {isLoading ? 'Guardando…' : isEditing ? 'Guardar cambios' : 'Crear meta'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
