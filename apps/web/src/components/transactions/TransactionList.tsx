/**
 * Transaction List Component
 * Sprint 13 - US-120
 */

import type { Transaction } from '@horus/shared';
import { TransactionItem } from './TransactionItem';

interface TransactionListProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  isLoading?: boolean;
}

export function TransactionList({
  transactions,
  onEdit,
  onDelete,
  isLoading,
}: TransactionListProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow border border-gray-200">
        {[...Array(5)].map((_, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-4 border-b border-gray-200 animate-pulse"
          >
            <div className="flex items-center gap-4 flex-1">
              <div className="w-16 h-12 bg-gray-200 rounded"></div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex flex-col gap-2">
                  <div className="w-32 h-4 bg-gray-200 rounded"></div>
                  <div className="w-48 h-3 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
            <div className="w-24 h-6 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
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
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay transacciones</h3>
        <p className="text-gray-600">
          Crea tu primera transacción para comenzar a registrar tus movimientos
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
      {transactions.map((transaction) => (
        <TransactionItem
          key={transaction.id}
          transaction={transaction}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
