/**
 * Transaction Item Component
 * Sprint 13 - US-120
 */

import { useState } from 'react';
import type { Transaction } from '@horus/shared';
import { formatCurrency } from '@/utils/currency';

interface TransactionItemProps {
  transaction: Transaction;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
}

export function TransactionItem({ transaction, onEdit, onDelete }: TransactionItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  const isIncome = transaction.type === 'ingreso';
  const amountClass = isIncome ? 'text-green-600' : 'text-red-600';
  const amountSign = isIncome ? '+' : '-';

  return (
    <div
      className="flex items-center justify-between p-4 bg-white border-b border-gray-200 hover:bg-gray-50 transition-colors"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center gap-4 flex-1">
        {/* Date */}
        <div className="flex flex-col items-center justify-center w-16 text-center">
          <span className="text-xs text-gray-500">{formatDate(transaction.date)}</span>
        </div>

        {/* Category Icon & Name */}
        <div className="flex items-center gap-2">
          <span className="text-2xl">{transaction.category?.icon || '📊'}</span>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900">
              {transaction.category?.name || 'Sin categoría'}
            </span>
            <span className="text-xs text-gray-500">{transaction.concept}</span>
          </div>
        </div>

        {/* Transfer Badge */}
        {transaction.isTransfer && (
          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
            Transferencia
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Amount */}
        <div className={`text-lg font-semibold ${amountClass}`}>
          {amountSign}
          {formatCurrency(transaction.amount, transaction.account?.currency || 'ARS')}
        </div>

        {/* Hover Actions */}
        {isHovered && !transaction.isTransfer && (
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(transaction);
              }}
              className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              title="Editar"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                onDelete(transaction);
              }}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Eliminar"
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
        )}

        {/* Warning for transfers */}
        {isHovered && transaction.isTransfer && (
          <span className="text-xs text-gray-500 italic">
            Las transferencias no se pueden editar aquí
          </span>
        )}
      </div>
    </div>
  );
}
