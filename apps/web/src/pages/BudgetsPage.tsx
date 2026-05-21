/**
 * Budgets Page
 * F-01 - Presupuestos Mensuales por Categoría
 */

import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import type { Budget, BudgetSummary } from '@horus/shared';
import {
  useBudgets,
  useBudgetsSummary,
  useCreateBudget,
  useUpdateBudget,
  useDeleteBudget,
} from '@/hooks/useBudgets';
import { BudgetCard } from '@/components/budgets/BudgetCard';
import { BudgetFormModal } from '@/components/budgets/BudgetFormModal';

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

export function BudgetsPage() {
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [deletingBudget, setDeletingBudget] = useState<BudgetSummary | null>(null);

  const { data: budgetsData } = useBudgets();
  const { data: summaryData, isLoading } = useBudgetsSummary(selectedMonth, selectedYear);
  const createMutation = useCreateBudget();
  const updateMutation = useUpdateBudget();
  const deleteMutation = useDeleteBudget();

  const summary = summaryData?.summary ?? [];

  const handleOpenCreate = () => {
    setEditingBudget(null);
    setModalOpen(true);
  };

  const handleEdit = (budget: BudgetSummary) => {
    // Find base budget object for editing
    const base = budgetsData?.budgets?.find((b) => b.id === budget.id) ?? budget;
    setEditingBudget(base as Budget);
    setModalOpen(true);
  };

  const handleDelete = (budget: BudgetSummary) => {
    setDeletingBudget(budget);
  };

  const confirmDelete = async () => {
    if (!deletingBudget) return;
    await deleteMutation.mutateAsync(deletingBudget.id);
    setDeletingBudget(null);
  };

  const handleSubmit = async (data: { categoryId: string; amount: number; currency: string }) => {
    if (editingBudget) {
      await updateMutation.mutateAsync({
        id: editingBudget.id,
        data: { amount: data.amount, currency: data.currency },
      });
    } else {
      await createMutation.mutateAsync(data);
    }
    setModalOpen(false);
  };

  const currentYear = today.getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">💰 Presupuestos</h1>
          <p className="text-sm text-gray-500 mt-1">Control de gastos por categoría y moneda</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo presupuesto
        </button>
      </div>

      {/* Month / Year selector */}
      <div className="flex gap-3 mb-6">
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(Number(e.target.value))}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {MONTHS.map((name, i) => (
            <option key={i + 1} value={i + 1}>
              {name}
            </option>
          ))}
        </select>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      ) : summary.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
            <span className="text-3xl">🎯</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Sin presupuestos</h3>
          <p className="text-sm text-gray-500 mb-6 max-w-sm">
            Creá un presupuesto por categoría para controlar tus gastos mensuales.
          </p>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Crear primer presupuesto
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {summary.map((item) => (
            <BudgetCard key={item.id} budget={item} onEdit={handleEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Form Modal */}
      <BudgetFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        editingBudget={editingBudget}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete confirmation */}
      {deletingBudget && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setDeletingBudget(null)}
          />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Eliminar presupuesto</h3>
              <p className="text-sm text-gray-500 mb-6">
                ¿Eliminar el presupuesto de <strong>{deletingBudget.category?.name}</strong> en{' '}
                {deletingBudget.currency}? Esta acción no se puede deshacer.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeletingBudget(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleteMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
