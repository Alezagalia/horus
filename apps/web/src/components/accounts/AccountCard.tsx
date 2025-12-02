/**
 * Account Card Component
 * Sprint 13 - US-119
 */

import { useState } from 'react';
import type { Account } from '@horus/shared';
import { ACCOUNT_TYPE_LABELS } from '@horus/shared';
import { formatCurrency } from '@/utils/currency';

interface AccountCardProps {
  account: Account;
  onEdit: (account: Account) => void;
  onDeactivate: (account: Account) => void;
  onTransfer: (account: Account) => void;
}

export function AccountCard({ account, onEdit, onDeactivate, onTransfer }: AccountCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative bg-white rounded-lg shadow-md border border-gray-200 p-6 transition-all hover:shadow-lg cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ borderLeftColor: account.color, borderLeftWidth: '4px' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{account.icon}</span>
          <div>
            <h3 className="font-semibold text-gray-900">{account.name}</h3>
            <span className="inline-block px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded mt-1">
              {ACCOUNT_TYPE_LABELS[account.type]}
            </span>
          </div>
        </div>
      </div>

      {/* Balance */}
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-1">Saldo actual</p>
        <p className="text-2xl font-bold text-gray-900">
          {formatCurrency(account.currentBalance, account.currency)}
        </p>
      </div>

      {/* Currency Badge */}
      <div className="flex items-center gap-2">
        <span className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-700 rounded">
          {account.currency}
        </span>
      </div>

      {/* Hover Actions */}
      {isHovered && (
        <div className="absolute top-2 right-2 flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTransfer(account);
            }}
            className="p-2 bg-white rounded-lg shadow-md hover:bg-indigo-50 transition-colors"
            title="Transferir"
          >
            <svg
              className="w-4 h-4 text-indigo-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
              />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(account);
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
              onDeactivate(account);
            }}
            className="p-2 bg-white rounded-lg shadow-md hover:bg-red-50 transition-colors"
            title="Desactivar"
          >
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
          </button>
        </div>
      )}
    </div>
  );
}
