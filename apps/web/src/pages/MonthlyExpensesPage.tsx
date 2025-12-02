/**
 * Monthly Expenses Page
 * Sprint 13 - US-123
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Toaster } from 'react-hot-toast';
import type { Currency } from '@horus/shared';
import type { MonthlyExpense } from '@horus/shared';
import {
  useMonthlyExpenses,
  usePayMonthlyExpense,
  useUpdateMonthlyExpense,
  useUndoMonthlyExpensePayment,
} from '@/hooks/useMonthlyExpenses';
import { useAccounts } from '@/hooks/useAccounts';
import { formatCurrency } from '@/utils/currency';

const MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const payFormSchema = z.object({
  amount: z.number().min(0.01, 'El monto debe ser mayor a 0'),
  accountId: z.string().min(1, 'Cuenta requerida'),
  paidDate: z.string().min(1, 'Fecha requerida'),
  notes: z.string().max(500, 'Máximo 500 caracteres').optional(),
});

type PayFormData = z.infer<typeof payFormSchema>;

export function MonthlyExpensesPage() {
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [showPaid, setShowPaid] = useState(false);
  const [payingExpense, setPayingExpense] = useState<MonthlyExpense | null>(null);
  const [editingExpense, setEditingExpense] = useState<MonthlyExpense | null>(null);
  const [undoingExpense, setUndoingExpense] = useState<MonthlyExpense | null>(null);

  const { data, isLoading } = useMonthlyExpenses(selectedMonth, selectedYear);
  const { data: accounts = [] } = useAccounts();
  const payMutation = usePayMonthlyExpense();
  const updateMutation = useUpdateMonthlyExpense();
  const undoMutation = useUndoMonthlyExpensePayment();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<PayFormData>({
    resolver: zodResolver(payFormSchema),
    defaultValues: {
      amount: 0,
      accountId: '',
      paidDate: new Date().toISOString().split('T')[0],
      notes: '',
    },
  });

  const expenses = data?.monthlyExpenses || [];
  const pendingExpenses = expenses.filter((e) => e.status === 'pendiente');
  const paidExpenses = expenses.filter((e) => e.status === 'pagado');

  const selectedAccountId = watch('accountId');
  const amount = watch('amount');
  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  const totalPending = pendingExpenses.reduce((sum, e) => sum + (e.previousAmount || 0), 0);
  const totalPaid = paidExpenses.reduce((sum, e) => sum + e.amount, 0);

  const goToPreviousMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const goToCurrentMonth = () => {
    setSelectedMonth(today.getMonth() + 1);
    setSelectedYear(today.getFullYear());
  };

  const handlePayClick = (expense: MonthlyExpense) => {
    setPayingExpense(expense);
    reset({
      amount: expense.previousAmount || 0,
      accountId: '',
      paidDate: new Date().toISOString().split('T')[0],
      notes: '',
    });
  };

  const handlePaySubmit = (formData: PayFormData) => {
    if (payingExpense) {
      payMutation.mutate(
        {
          id: payingExpense.id,
          data: {
            amount: formData.amount,
            accountId: formData.accountId,
            paidDate: new Date(formData.paidDate).toISOString(),
            notes: formData.notes || undefined,
          },
        },
        {
          onSuccess: () => {
            setPayingExpense(null);
            reset();
          },
        }
      );
    }
  };

  const handleEditClick = (expense: MonthlyExpense) => {
    setEditingExpense(expense);
    reset({
      amount: expense.amount,
      accountId: expense.accountId || '',
      paidDate: expense.paidDate
        ? new Date(expense.paidDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      notes: expense.notes || '',
    });
  };

  const handleEditSubmit = (formData: PayFormData) => {
    if (editingExpense) {
      updateMutation.mutate(
        {
          id: editingExpense.id,
          data: {
            amount: formData.amount,
            accountId: formData.accountId,
            paidDate: new Date(formData.paidDate).toISOString(),
            notes: formData.notes || undefined,
          },
        },
        {
          onSuccess: () => {
            setEditingExpense(null);
            reset();
          },
        }
      );
    }
  };

  const confirmUndo = () => {
    if (undoingExpense) {
      undoMutation.mutate(undoingExpense.id, {
        onSuccess: () => {
          setUndoingExpense(null);
        },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando gastos...</p>
        </div>
      </div>
    );
  }

  const isCurrentMonth =
    selectedMonth === today.getMonth() + 1 && selectedYear === today.getFullYear();

  return (
    <div>
      <Toaster position="top-right" />

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Gastos del Mes - {MONTHS[selectedMonth - 1]} {selectedYear}
            </h1>
            <p className="text-gray-600 mt-1">Controla tus gastos recurrentes mensuales</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousMonth}
              className="p-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              title="Mes anterior"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              onClick={goToCurrentMonth}
              disabled={isCurrentMonth}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Mes Actual
            </button>
            <button
              onClick={goToNextMonth}
              className="p-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              title="Mes siguiente"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Pending Expenses Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Pendientes ({pendingExpenses.length})
        </h2>
        {pendingExpenses.length === 0 ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-lg font-semibold text-green-900 mb-2">No hay gastos pendientes</h3>
            <p className="text-green-700">Todos los gastos del mes están pagados</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingExpenses.map((expense) => (
              <div
                key={expense.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <span className="text-3xl">{expense.category?.icon || '📄'}</span>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{expense.concept}</h3>
                      <p className="text-sm text-gray-600">{expense.category?.name}</p>
                      {expense.previousAmount && (
                        <p className="text-xs text-gray-500 mt-1">
                          Mes anterior:{' '}
                          {formatCurrency(
                            expense.previousAmount,
                            (expense.recurringExpense?.currency || 'ARS') as Currency
                          )}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-400">$0</p>
                      <span className="inline-block px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded mt-1">
                        Pendiente
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handlePayClick(expense)}
                    className="ml-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                  >
                    Marcar como Pagado
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Paid Expenses Section (Collapsible) */}
      <div className="mb-8">
        <button
          onClick={() => setShowPaid(!showPaid)}
          className="w-full flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 mb-4"
        >
          <h2 className="text-xl font-semibold text-gray-900">Pagados ({paidExpenses.length})</h2>
          <svg
            className={`w-6 h-6 text-gray-600 transition-transform ${showPaid ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showPaid && (
          <div className="space-y-3">
            {paidExpenses.map((expense) => (
              <div key={expense.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <span className="text-3xl">{expense.category?.icon || '📄'}</span>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{expense.concept}</h3>
                      <p className="text-sm text-gray-600">{expense.category?.name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Pagado: {new Date(expense.paidDate!).toLocaleDateString()} •{' '}
                        {expense.account?.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(
                          expense.amount,
                          (expense.recurringExpense?.currency || 'ARS') as Currency
                        )}
                      </p>
                      <span className="inline-block px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded mt-1">
                        Pagado
                      </span>
                    </div>
                  </div>
                  <div className="ml-4 flex gap-2">
                    <button
                      onClick={() => handleEditClick(expense)}
                      className="px-3 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => setUndoingExpense(expense)}
                      className="px-3 py-1 text-sm text-red-700 bg-white border border-red-300 rounded hover:bg-red-50"
                    >
                      Deshacer
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary Footer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <p className="text-sm text-yellow-700 mb-1">Total Pendiente (estimado)</p>
          <p className="text-3xl font-bold text-yellow-900">
            {formatCurrency(totalPending, 'ARS')}
          </p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <p className="text-sm text-green-700 mb-1">Total Pagado</p>
          <p className="text-3xl font-bold text-green-900">{formatCurrency(totalPaid, 'ARS')}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <p className="text-sm text-blue-700 mb-1">Total del Mes</p>
          <p className="text-3xl font-bold text-blue-900">
            {formatCurrency(totalPending + totalPaid, 'ARS')}
          </p>
        </div>
      </div>

      {/* Pay Modal */}
      {payingExpense && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setPayingExpense(null)}
          />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Pagar: {payingExpense.concept}
              </h2>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Categoría:</span>
                    <p className="font-medium">{payingExpense.category?.name}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Mes anterior:</span>
                    <p className="font-medium">
                      {payingExpense.previousAmount
                        ? formatCurrency(
                            payingExpense.previousAmount,
                            (payingExpense.recurringExpense?.currency || 'ARS') as Currency
                          )
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit(handlePaySubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monto *</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('amount', { valueAsNumber: true })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {errors.amount && (
                    <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cuenta *</label>
                  <select
                    {...register('accountId')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Seleccionar cuenta</option>
                    {accounts
                      .filter((a) => a.isActive)
                      .map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.icon} {account.name} (
                          {formatCurrency(account.currentBalance, account.currency)})
                        </option>
                      ))}
                  </select>
                  {errors.accountId && (
                    <p className="mt-1 text-sm text-red-600">{errors.accountId.message}</p>
                  )}
                  {selectedAccount && amount > selectedAccount.currentBalance && (
                    <p className="mt-1 text-sm text-amber-600">⚠️ Saldo insuficiente</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
                  <input
                    type="date"
                    {...register('paidDate')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {errors.paidDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.paidDate.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                  <textarea
                    {...register('notes')}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    maxLength={500}
                  />
                  {errors.notes && (
                    <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setPayingExpense(null)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                  >
                    Confirmar Pago
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingExpense && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setEditingExpense(null)}
          />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Editar: {editingExpense.concept}
              </h2>

              <form onSubmit={handleSubmit(handleEditSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monto *</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('amount', { valueAsNumber: true })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {errors.amount && (
                    <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cuenta *</label>
                  <select
                    {...register('accountId')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Seleccionar cuenta</option>
                    {accounts
                      .filter((a) => a.isActive)
                      .map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.icon} {account.name}
                        </option>
                      ))}
                  </select>
                  {errors.accountId && (
                    <p className="mt-1 text-sm text-red-600">{errors.accountId.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
                  <input
                    type="date"
                    {...register('paidDate')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {errors.paidDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.paidDate.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                  <textarea
                    {...register('notes')}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    maxLength={500}
                  />
                </div>

                <div className="flex justify-between gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setUndoingExpense(editingExpense);
                      setEditingExpense(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                  >
                    Deshacer Pago
                  </button>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setEditingExpense(null)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                    >
                      Guardar Cambios
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Undo Confirmation Modal */}
      {undoingExpense && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setUndoingExpense(null)}
          />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Deshacer pago</h3>
              <p className="text-gray-600 mb-2">¿Deshacer el pago de "{undoingExpense.concept}"?</p>
              <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded mb-4">
                ⚠️ El gasto volverá a estado pendiente y el saldo de la cuenta se restaurará.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setUndoingExpense(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmUndo}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                >
                  Deshacer Pago
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
