/**
 * Recurring Expenses Page
 * Sprint 13 - US-122
 */

import { useState, useMemo } from 'react';
import { Toaster } from 'react-hot-toast';
import type { RecurringExpense } from '@horus/shared';
import {
  useRecurringExpenses,
  useCreateRecurringExpense,
  useUpdateRecurringExpense,
} from '@/hooks/useRecurringExpenses';
import { RecurringExpenseCard } from '@/components/recurringExpenses/RecurringExpenseCard';
import { RecurringExpenseFormModal } from '@/components/recurringExpenses/RecurringExpenseFormModal';

export function RecurringExpensesPage() {
  const [showInactive, setShowInactive] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<RecurringExpense | null>(null);
  const [togglingExpense, setTogglingExpense] = useState<RecurringExpense | null>(null);

  const { data, isLoading } = useRecurringExpenses({ activeOnly: !showInactive });
  const createMutation = useCreateRecurringExpense();
  const updateMutation = useUpdateRecurringExpense();

  const expenses = data?.recurringExpenses || [];

  // Sort alphabetically by concept
  const sortedExpenses = useMemo(() => {
    return [...expenses].sort((a, b) => a.concept.localeCompare(b.concept));
  }, [expenses]);

  const handleCreateNew = () => {
    setEditingExpense(null);
    setIsFormModalOpen(true);
  };

  const handleEdit = (expense: RecurringExpense) => {
    setEditingExpense(expense);
    setIsFormModalOpen(true);
  };

  const handleToggleActive = (expense: RecurringExpense) => {
    if (expense.isActive) {
      // Show confirmation for deactivate
      setTogglingExpense(expense);
    } else {
      // Activate without confirmation
      updateMutation.mutate({
        id: expense.id,
        data: { isActive: true },
      });
    }
  };

  const confirmDeactivate = () => {
    if (togglingExpense) {
      updateMutation.mutate(
        {
          id: togglingExpense.id,
          data: { isActive: false },
        },
        {
          onSuccess: () => {
            setTogglingExpense(null);
          },
        }
      );
    }
  };

  const handleSubmitForm = (data: any) => {
    if (editingExpense) {
      // Edit
      updateMutation.mutate(
        {
          id: editingExpense.id,
          data: {
            concept: data.concept,
            categoryId: data.categoryId,
            currency: data.currency,
          },
        },
        {
          onSuccess: () => {
            setIsFormModalOpen(false);
            setEditingExpense(null);
          },
        }
      );
    } else {
      // Create
      createMutation.mutate(data, {
        onSuccess: () => {
          setIsFormModalOpen(false);
        },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando plantillas...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Toaster position="top-right" />

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gastos Recurrentes Mensuales</h1>
            <p className="text-gray-600 mt-1">
              Configura tus gastos fijos mensuales. Se generarán automáticamente cada mes.
            </p>
          </div>
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Nueva Plantilla
          </button>
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="showInactive"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          />
          <label htmlFor="showInactive" className="text-sm text-gray-700 cursor-pointer">
            Mostrar plantillas inactivas
          </label>
        </div>
      </div>

      {/* Expenses List */}
      <div className="mb-8">
        {sortedExpenses.length === 0 ? (
          <div className="bg-white rounded-lg shadow border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {showInactive ? 'No hay plantillas inactivas' : 'No tienes plantillas aún'}
            </h3>
            <p className="text-gray-600 mb-4">
              {showInactive
                ? 'Todas tus plantillas están activas'
                : 'Crea tu primera plantilla de gasto recurrente para automatizar tus gastos mensuales'}
            </p>
            {!showInactive && (
              <button
                onClick={handleCreateNew}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Nueva Plantilla
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedExpenses.map((expense) => (
              <RecurringExpenseCard
                key={expense.id}
                expense={expense}
                onEdit={handleEdit}
                onToggleActive={handleToggleActive}
              />
            ))}
          </div>
        )}
      </div>

      {/* Form Modal */}
      <RecurringExpenseFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingExpense(null);
        }}
        onSubmit={handleSubmitForm}
        editingExpense={editingExpense}
      />

      {/* Deactivate Confirmation Modal */}
      {togglingExpense && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setTogglingExpense(null)}
          />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Desactivar plantilla</h3>
              <p className="text-gray-600 mb-4">
                ¿Estás seguro de que deseas desactivar la plantilla "{togglingExpense.concept}"?
              </p>
              <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded mb-4">
                ⚠️ La plantilla dejará de generar nuevas instancias mensuales. Las instancias ya
                generadas no se verán afectadas.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setTogglingExpense(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeactivate}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                >
                  Desactivar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
