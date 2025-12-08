/**
 * Transaction Form Modal Component (Create/Edit)
 * Sprint 13 - US-120
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Transaction, TransactionType } from '@horus/shared';
import { useCategories } from '@/hooks/useCategories';
import { useAccounts } from '@/hooks/useAccounts';
import { formatCurrency } from '@/utils/currency';

const formSchema = z.object({
  type: z.enum(['ingreso', 'egreso'] as const),
  accountId: z.string().min(1, 'Cuenta requerida'),
  categoryId: z.string().min(1, 'Categoría requerida'),
  amount: z.number().min(0.01, 'El monto debe ser mayor a 0'),
  concept: z.string().min(1, 'Concepto requerido').max(200, 'Máximo 200 caracteres'),
  date: z.string().min(1, 'Fecha requerida'),
  notes: z.string().max(1000, 'Máximo 1000 caracteres').optional(),
});

export type TransactionFormData = z.infer<typeof formSchema>;

interface TransactionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TransactionFormData) => void;
  editingTransaction?: Transaction | null;
  defaultAccountId?: string;
  defaultType?: TransactionType;
  isSubmitting?: boolean;
}

export function TransactionFormModal({
  isOpen,
  onClose,
  onSubmit,
  editingTransaction,
  defaultAccountId,
  defaultType = 'egreso',
  isSubmitting = false,
}: TransactionFormModalProps) {
  const { data: categories = [] } = useCategories();
  const { data: accounts = [] } = useAccounts();

  // Ensure accounts is array and filter active ones
  const accountsList = Array.isArray(accounts) ? accounts : [];
  const activeAccounts = accountsList.filter((acc) => acc.isActive);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: defaultType,
      accountId: defaultAccountId || '',
      categoryId: '',
      amount: 0,
      concept: '',
      date: new Date().toISOString().split('T')[0],
      notes: '',
    },
  });

  // Filter categories by scope (gastos for transactions)
  const expenseCategories = categories.filter((cat) => cat.scope === 'gastos');

  // Get selected account to show balance
  const selectedAccountId = watch('accountId');
  const selectedAccount = activeAccounts.find((acc) => acc.id === selectedAccountId);

  useEffect(() => {
    if (editingTransaction) {
      reset({
        type: editingTransaction.type,
        accountId: editingTransaction.accountId,
        categoryId: editingTransaction.categoryId,
        amount: editingTransaction.amount,
        concept: editingTransaction.concept,
        date: new Date(editingTransaction.date).toISOString().split('T')[0],
        notes: editingTransaction.notes || '',
      });
    } else {
      reset({
        type: defaultType,
        accountId: defaultAccountId || '',
        categoryId: '',
        amount: 0,
        concept: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
      });
    }
  }, [editingTransaction, defaultAccountId, defaultType, reset, isOpen]);

  if (!isOpen) return null;

  const isEditing = !!editingTransaction;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-lg">
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditing ? 'Editar Transacción' : 'Nueva Transacción'}
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
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
            {/* Type Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo *</label>
              <div className="flex gap-2">
                <label
                  className={`flex-1 flex items-center justify-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                    watch('type') === 'ingreso'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <input
                    type="radio"
                    value="ingreso"
                    {...register('type')}
                    disabled={isEditing}
                    className="text-green-600"
                  />
                  <span className="text-xl">💰</span>
                  <span className="text-sm font-medium">Ingreso</span>
                </label>
                <label
                  className={`flex-1 flex items-center justify-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                    watch('type') === 'egreso'
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <input
                    type="radio"
                    value="egreso"
                    {...register('type')}
                    disabled={isEditing}
                    className="text-red-600"
                  />
                  <span className="text-xl">💸</span>
                  <span className="text-sm font-medium">Egreso</span>
                </label>
              </div>
              {isEditing && (
                <p className="mt-1 text-xs text-gray-500">El tipo no puede modificarse</p>
              )}
            </div>

            {/* Account selection */}
            <div>
              <label htmlFor="accountId" className="block text-sm font-medium text-gray-700 mb-1">
                Cuenta *
              </label>
              <select
                id="accountId"
                {...register('accountId')}
                disabled={isEditing || !!defaultAccountId}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  isEditing || defaultAccountId ? 'bg-gray-50 cursor-not-allowed' : ''
                }`}
              >
                <option value="">Seleccionar cuenta</option>
                {activeAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.icon} {acc.name} ({acc.currency})
                  </option>
                ))}
              </select>
              {errors.accountId && (
                <p className="mt-1 text-sm text-red-600">{errors.accountId.message}</p>
              )}
              {selectedAccount && (
                <p className="mt-1 text-xs text-gray-500">
                  Saldo: {formatCurrency(selectedAccount.currentBalance, selectedAccount.currency)}
                </p>
              )}
              {isEditing && (
                <p className="mt-1 text-xs text-gray-500">La cuenta no puede modificarse</p>
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

            {/* Amount */}
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                Monto *
              </label>
              <input
                id="amount"
                type="number"
                step="0.01"
                {...register('amount', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="0.00"
              />
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
              )}
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
                placeholder="Ej: Compra en supermercado"
                maxLength={200}
              />
              {errors.concept && (
                <p className="mt-1 text-sm text-red-600">{errors.concept.message}</p>
              )}
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

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notas (opcional)
              </label>
              <textarea
                id="notes"
                {...register('notes')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Notas adicionales..."
                maxLength={1000}
              />
              {errors.notes && <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                {isEditing ? 'Guardar Cambios' : 'Crear Transacción'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
