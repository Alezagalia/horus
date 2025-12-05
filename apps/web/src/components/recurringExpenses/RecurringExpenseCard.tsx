/**
 * Recurring Expense Card Component
 * Sprint 13 - US-122
 */

import { useState } from 'react';
import type { RecurringExpense } from '@horus/shared';

interface RecurringExpenseCardProps {
  expense: RecurringExpense;
  onEdit: (expense: RecurringExpense) => void;
  onToggleActive: (expense: RecurringExpense) => void;
}

export function RecurringExpenseCard({
  expense,
  onEdit,
  onToggleActive,
}: RecurringExpenseCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative bg-white rounded-lg shadow border border-gray-200 p-6 transition-all hover:shadow-lg"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1">
          {/* Category Icon */}
          <div className="flex-shrink-0">
            <span className="text-3xl">{expense.category?.icon || '📄'}</span>
          </div>

          {/* Concept and Category */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-lg truncate">{expense.concept}</h3>
            <p className="text-sm text-gray-600 truncate">
              {expense.category?.name || 'Sin categoría'}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <span
          className={`px-3 py-1 text-xs font-medium rounded-full ${
            expense.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
          }`}
        >
          {expense.isActive ? 'Activa' : 'Inactiva'}
        </span>
      </div>

      {/* Currency and Due Day */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-700 rounded">
          {expense.currency}
        </span>
        {expense.dueDay && (
          <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Vence día {expense.dueDay}
          </span>
        )}
      </div>

      {/* Hover Actions */}
      {isHovered && (
        <div className="absolute top-2 right-2 flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(expense);
            }}
            className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors"
            title="Editar"
          >
            <svg
              className="w-4 h-4 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleActive(expense);
            }}
            className={`p-2 bg-white rounded-lg shadow-md transition-colors ${
              expense.isActive ? 'hover:bg-red-50' : 'hover:bg-green-50'
            }`}
            title={expense.isActive ? 'Desactivar' : 'Activar'}
          >
            {expense.isActive ? (
              <svg
                className="w-4 h-4 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                />
              </svg>
            ) : (
              <svg
                className="w-4 h-4 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
