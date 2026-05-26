/**
 * ShoppingListPanel - lista de compras con checkboxes y link a finanzas
 * F-17 Sprint 3
 */

import { useState } from 'react';
import type { ShoppingList } from '@horus/shared';
import {
  useCheckShoppingItem,
  useLinkTransaction,
  useDeleteShoppingList,
} from '@/hooks/useNutrition';

interface ShoppingListPanelProps {
  list: ShoppingList;
  onDeleted?: () => void;
}

export function ShoppingListPanel({ list, onDeleted }: ShoppingListPanelProps) {
  const { mutate: checkItem } = useCheckShoppingItem();
  const { mutate: linkTransaction, isPending: linking } = useLinkTransaction();
  const { mutate: deleteList, isPending: deleting } = useDeleteShoppingList();
  const [txModal, setTxModal] = useState(false);
  const [txId, setTxId] = useState('');

  const checked = list.items.filter((i) => i.checked).length;
  const total = list.items.length;

  const handleLink = () => {
    if (!txId) return;
    linkTransaction(
      { listId: list.id, data: { transactionId: txId } },
      {
        onSuccess: () => setTxModal(false),
      }
    );
  };

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">{list.name}</h3>
            <p className="text-xs text-gray-500">
              {checked}/{total} ítems marcados
            </p>
          </div>
          <div className="flex gap-2">
            {!list.transactionId && (
              <button
                onClick={() => setTxModal(true)}
                className="px-3 py-1.5 text-xs font-medium bg-green-100 text-green-700 rounded-xl hover:bg-green-200 transition-colors"
              >
                💰 Registrar gasto
              </button>
            )}
            {list.transactionId && (
              <span className="px-3 py-1.5 text-xs font-medium bg-green-500 text-white rounded-xl">
                ✓ Gasto registrado
              </span>
            )}
            <button
              onClick={() => deleteList(list.id, { onSuccess: onDeleted })}
              disabled={deleting}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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
        <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all"
            style={{ width: total > 0 ? `${(checked / total) * 100}%` : '0%' }}
          />
        </div>
      </div>

      <div className="divide-y divide-gray-50">
        {list.items.map((item) => (
          <div
            key={item.id}
            className={`flex items-center gap-3 px-4 py-3 transition-colors ${item.checked ? 'bg-gray-50' : 'hover:bg-gray-50/50'}`}
          >
            <input
              type="checkbox"
              checked={item.checked}
              onChange={(e) =>
                checkItem({ listId: list.id, itemId: item.id, checked: e.target.checked })
              }
              className="w-4 h-4 text-indigo-600 rounded accent-indigo-600"
            />
            <span
              className={`flex-1 text-sm ${item.checked ? 'line-through text-gray-400' : 'text-gray-700'}`}
            >
              {item.name}
            </span>
            <span className="text-xs text-gray-500">
              {item.quantity}
              {item.unit}
            </span>
          </div>
        ))}
        {list.items.length === 0 && (
          <p className="text-center text-sm text-gray-400 py-6">Lista vacía</p>
        )}
      </div>

      {/* Link transaction modal */}
      {txModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h3 className="font-bold text-gray-900">Registrar como gasto</h3>
            <p className="text-sm text-gray-600">
              Pega el ID de la transacción que creaste en Finanzas para vincularla a esta lista.
            </p>
            <input
              value={txId}
              onChange={(e) => setTxId(e.target.value)}
              placeholder="UUID de la transacción"
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setTxModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleLink}
                disabled={!txId || linking}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600 disabled:opacity-50"
              >
                {linking ? 'Vinculando...' : 'Vincular'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
