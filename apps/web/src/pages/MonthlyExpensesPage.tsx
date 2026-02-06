/**
 * Monthly Expenses Page
 * Sprint 13 - US-123
 */

import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
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
  const [expandedPendingCategories, setExpandedPendingCategories] = useState<Set<string>>(new Set());
  const [expandedPaidCategories, setExpandedPaidCategories] = useState<Set<string>>(new Set());

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

  const totalPending = pendingExpenses.reduce((sum, e) => sum + Number(e.previousAmount || 0), 0);
  const totalPaid = paidExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

  // Group expenses by category
  const groupByCategory = (expenseList: MonthlyExpense[]) => {
    const grouped = expenseList.reduce(
      (acc, expense) => {
        const categoryName = expense.category?.name || 'Sin categoría';
        if (!acc[categoryName]) {
          acc[categoryName] = {
            category: expense.category,
            expenses: [],
          };
        }
        acc[categoryName].expenses.push(expense);
        return acc;
      },
      {} as Record<string, { category: MonthlyExpense['category']; expenses: MonthlyExpense[] }>
    );

    // Sort categories alphabetically
    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
  };

  // Helper to get due day status for the selected month
  const getDueDayStatus = (dueDay: number | null | undefined) => {
    if (!dueDay) return null;

    // Only show urgency for current month
    if (selectedMonth !== today.getMonth() + 1 || selectedYear !== today.getFullYear()) {
      return { text: `Vence día ${dueDay}`, class: 'bg-gray-100 text-gray-600', urgent: false };
    }

    const currentDay = today.getDate();
    const daysUntilDue = dueDay - currentDay;

    if (daysUntilDue < 0) {
      return { text: 'Vencido', class: 'bg-red-100 text-red-700', urgent: true };
    } else if (daysUntilDue === 0) {
      return { text: 'Vence hoy', class: 'bg-amber-100 text-amber-700', urgent: true };
    } else if (daysUntilDue <= 3) {
      return { text: `Vence en ${daysUntilDue}d`, class: 'bg-amber-100 text-amber-700', urgent: false };
    } else {
      return { text: `Vence día ${dueDay}`, class: 'bg-gray-100 text-gray-600', urgent: false };
    }
  };

  // Sort pending expenses: no due day first, then by due day ascending
  const sortedPendingExpenses = useMemo(() => {
    return [...pendingExpenses].sort((a, b) => {
      const dueDayA = a.recurringExpense?.dueDay;
      const dueDayB = b.recurringExpense?.dueDay;

      // No due day comes first
      if (!dueDayA && dueDayB) return -1;
      if (dueDayA && !dueDayB) return 1;
      // Both have due day: sort ascending (closest first)
      if (dueDayA && dueDayB) return dueDayA - dueDayB;
      return 0;
    });
  }, [pendingExpenses]);

  // Group expenses by category (memoized to prevent infinite loops)
  const groupedPendingExpenses = useMemo(
    () => groupByCategory(sortedPendingExpenses),
    [sortedPendingExpenses]
  );
  const groupedPaidExpenses = useMemo(() => groupByCategory(paidExpenses), [paidExpenses]);

  const togglePendingCategory = (categoryName: string) => {
    const newSet = new Set(expandedPendingCategories);
    if (newSet.has(categoryName)) {
      newSet.delete(categoryName);
    } else {
      newSet.add(categoryName);
    }
    setExpandedPendingCategories(newSet);
  };

  const togglePaidCategory = (categoryName: string) => {
    const newSet = new Set(expandedPaidCategories);
    if (newSet.has(categoryName)) {
      newSet.delete(categoryName);
    } else {
      newSet.add(categoryName);
    }
    setExpandedPaidCategories(newSet);
  };

  // Auto-expand all pending categories when data changes
  useEffect(() => {
    setExpandedPendingCategories(new Set(groupedPendingExpenses.map(([categoryName]) => categoryName)));
  }, [groupedPendingExpenses]);

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
            paidDate: `${formData.paidDate}T12:00:00.000Z`,
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
            paidDate: `${formData.paidDate}T12:00:00.000Z`,
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Gastos Mensuales - {MONTHS[selectedMonth - 1]} {selectedYear}
            </h1>
            <p className="text-gray-600 mt-1">Controla tus gastos fijos del mes</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/recurring-expenses"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
              title="Configurar gastos recurrentes"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              Configurar Plantillas
            </Link>
            <div className="h-8 w-px bg-gray-300 hidden sm:block" />
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
              Hoy
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
        {sortedPendingExpenses.length === 0 ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-lg font-semibold text-green-900 mb-2">No hay gastos pendientes</h3>
            <p className="text-green-700">Todos los gastos del mes están pagados</p>
          </div>
        ) : (
          <div className="space-y-4">
            {groupedPendingExpenses.map(([categoryName, { category, expenses }]) => {
              const categoryTotal = expenses.reduce((sum, e) => sum + Number(e.previousAmount || 0), 0);
              const isExpanded = expandedPendingCategories.has(categoryName);

              return (
                <div key={categoryName} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Category Header */}
                  <button
                    onClick={() => togglePendingCategory(categoryName)}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{category?.icon || '📁'}</span>
                      <div className="text-left">
                        <h3 className="font-semibold text-gray-900">{categoryName}</h3>
                        <p className="text-sm text-gray-600">{expenses.length} gasto{expenses.length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-lg font-bold text-gray-700">
                        {formatCurrency(categoryTotal, 'ARS')}
                      </p>
                      <svg
                        className={`w-5 h-5 text-gray-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {/* Category Expenses */}
                  {isExpanded && (
                    <div className="divide-y divide-gray-200">
                      {expenses.map((expense) => {
                        const dueStatus = getDueDayStatus(expense.recurringExpense?.dueDay);
                        return (
                          <div
                            key={expense.id}
                            className={`p-4 hover:bg-gray-50 transition-colors ${
                              dueStatus?.urgent ? 'bg-red-50' : 'bg-white'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 flex-1">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="font-semibold text-gray-900">{expense.concept}</h3>
                                    {dueStatus && (
                                      <span className={`px-2 py-0.5 text-xs font-medium rounded ${dueStatus.class}`}>
                                        {dueStatus.text}
                                      </span>
                                    )}
                                  </div>
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
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
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
          <div className="space-y-4">
            {groupedPaidExpenses.map(([categoryName, { category, expenses }]) => {
              const categoryTotal = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
              const isExpanded = expandedPaidCategories.has(categoryName);

              return (
                <div key={categoryName} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Category Header */}
                  <button
                    onClick={() => togglePaidCategory(categoryName)}
                    className="w-full flex items-center justify-between p-4 bg-green-50 hover:bg-green-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{category?.icon || '📁'}</span>
                      <div className="text-left">
                        <h3 className="font-semibold text-gray-900">{categoryName}</h3>
                        <p className="text-sm text-gray-600">{expenses.length} gasto{expenses.length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-lg font-bold text-green-700">
                        {formatCurrency(categoryTotal, 'ARS')}
                      </p>
                      <svg
                        className={`w-5 h-5 text-gray-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {/* Category Expenses */}
                  {isExpanded && (
                    <div className="divide-y divide-gray-200">
                      {expenses.map((expense) => (
                        <div key={expense.id} className="bg-white p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 flex-1">
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900">{expense.concept}</h3>
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
              );
            })}
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

              {/* Template Notes (if available) */}
              {payingExpense.recurringExpense?.notes && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
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
                      <p className="text-sm font-medium text-blue-900 mb-1">Observación de la plantilla:</p>
                      <p className="text-sm text-blue-800 whitespace-pre-wrap">{payingExpense.recurringExpense.notes}</p>
                    </div>
                  </div>
                </div>
              )}

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
