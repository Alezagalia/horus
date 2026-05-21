/**
 * Budget Card Component
 * F-01 - Presupuestos Mensuales por Categoría
 */

import type { BudgetSummary, Currency } from '@horus/shared';
import { formatCurrency } from '@/utils/currency';

interface BudgetCardProps {
  budget: BudgetSummary;
  onEdit: (budget: BudgetSummary) => void;
  onDelete: (budget: BudgetSummary) => void;
}

function getBarColor(percentage: number) {
  if (percentage >= 100) return 'bg-red-500';
  if (percentage >= 80) return 'bg-yellow-500';
  return 'bg-green-500';
}

function getTextColor(percentage: number) {
  if (percentage >= 100) return 'text-red-600';
  if (percentage >= 80) return 'text-yellow-600';
  return 'text-green-600';
}

export function BudgetCard({ budget, onEdit, onDelete }: BudgetCardProps) {
  const currency = budget.currency as Currency;
  const clampedPct = Math.min(budget.percentage, 100);
  const isOver = budget.percentage >= 100;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 group hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {budget.category?.icon && <span className="text-2xl">{budget.category.icon}</span>}
          <div>
            <p className="font-semibold text-gray-900 text-sm">{budget.category?.name ?? '—'}</p>
            <p className="text-xs text-gray-400">{budget.currency}</p>
          </div>
        </div>

        {/* Actions (visible on hover) */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(budget)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
            title="Editar presupuesto"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
          </button>
          <button
            onClick={() => onDelete(budget)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Eliminar presupuesto"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className={`text-sm font-semibold ${getTextColor(budget.percentage)}`}>
            {budget.percentage}%
          </span>
          <span className="text-xs text-gray-400">{formatCurrency(budget.amount, currency)}</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-2.5 rounded-full transition-all duration-500 ${getBarColor(budget.percentage)}`}
            style={{ width: `${clampedPct}%` }}
          />
        </div>
      </div>

      {/* Amounts */}
      {isOver ? (
        <p className="text-sm text-red-600 font-medium">
          ⚠ Excedido por {formatCurrency(Math.abs(budget.remaining), currency)}
        </p>
      ) : (
        <p className="text-sm text-gray-500">
          <span className="font-medium text-gray-900">
            {formatCurrency(budget.spent, currency)}
          </span>
          {' gastado · quedan '}
          <span className="font-medium text-gray-900">
            {formatCurrency(budget.remaining, currency)}
          </span>
        </p>
      )}
    </div>
  );
}
