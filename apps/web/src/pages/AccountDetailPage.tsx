/**
 * Account Detail Page with Transactions
 * Sprint 13 - US-120
 */

import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import type { Transaction } from '@horus/shared';
import { ACCOUNT_TYPE_LABELS } from '@horus/shared';
import { useAccount } from '@/hooks/useAccounts';
import {
  useTransactions,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
} from '@/hooks/useTransactions';
import { TransactionList } from '@/components/transactions/TransactionList';
import { TransactionFormModal } from '@/components/transactions/TransactionFormModal';
import { TransferModal } from '@/components/transfers/TransferModal';
import { formatCurrency } from '@/utils/currency';

type TabType = 'all' | 'ingreso' | 'egreso' | 'transfer';

export function AccountDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const accountId = id!;

  const { data: account, isLoading: isLoadingAccount } = useAccount(accountId);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [offset, setOffset] = useState(0);
  const limit = 50;

  // Build query based on active tab
  const transactionsQuery = useMemo(() => {
    const query: any = {
      accountId,
      limit,
      offset,
    };

    if (activeTab === 'ingreso' || activeTab === 'egreso') {
      query.type = activeTab;
    }

    return query;
  }, [accountId, activeTab, offset]);

  const { data: transactionsData, isLoading: isLoadingTransactions } =
    useTransactions(transactionsQuery);

  const createMutation = useCreateTransaction();
  const updateMutation = useUpdateTransaction();
  const deleteMutation = useDeleteTransaction();

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);

  const handleCreateNew = () => {
    setEditingTransaction(null);
    setIsFormModalOpen(true);
  };

  const handleEdit = (transaction: Transaction) => {
    if (transaction.isTransfer) {
      // Don't allow editing transfers from transaction list
      return;
    }
    setEditingTransaction(transaction);
    setIsFormModalOpen(true);
  };

  const handleSubmitForm = (data: any) => {
    if (editingTransaction) {
      // Edit
      updateMutation.mutate(
        {
          id: editingTransaction.id,
          data: {
            amount: data.amount,
            concept: data.concept,
            date: new Date(data.date).toISOString(),
            notes: data.notes || null,
            categoryId: data.categoryId,
          },
        },
        {
          onSuccess: () => {
            setIsFormModalOpen(false);
            setEditingTransaction(null);
          },
        }
      );
    } else {
      // Create
      createMutation.mutate(
        {
          accountId,
          type: data.type,
          categoryId: data.categoryId,
          amount: data.amount,
          concept: data.concept,
          date: new Date(data.date).toISOString(),
          notes: data.notes || undefined,
        },
        {
          onSuccess: () => {
            setIsFormModalOpen(false);
          },
        }
      );
    }
  };

  const handleDelete = (transaction: Transaction) => {
    setDeletingTransaction(transaction);
  };

  const confirmDelete = () => {
    if (deletingTransaction) {
      deleteMutation.mutate(deletingTransaction.id, {
        onSuccess: () => {
          setDeletingTransaction(null);
        },
      });
    }
  };

  const filteredTransactions = useMemo(() => {
    if (!transactionsData?.transactions) return [];

    if (activeTab === 'transfer') {
      return transactionsData.transactions.filter((t) => t.isTransfer);
    }

    return transactionsData.transactions;
  }, [transactionsData, activeTab]);

  const handlePreviousPage = () => {
    if (offset > 0) {
      setOffset(offset - limit);
    }
  };

  const handleNextPage = () => {
    if (transactionsData && offset + limit < transactionsData.total) {
      setOffset(offset + limit);
    }
  };

  if (isLoadingAccount) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando cuenta...</p>
        </div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Cuenta no encontrada</h2>
          <button
            onClick={() => navigate('/accounts')}
            className="text-indigo-600 hover:text-indigo-700"
          >
            Volver a cuentas
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Toaster position="top-right" />

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => navigate('/accounts')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Volver"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl">{account.icon}</span>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{account.name}</h1>
                <span className="text-sm text-gray-600">{ACCOUNT_TYPE_LABELS[account.type]}</span>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-bold text-gray-900">
                {formatCurrency(account.currentBalance, account.currency)}
              </p>
              <span className="text-lg text-gray-600">{account.currency}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsTransferModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                />
              </svg>
              Transferir
            </button>
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
              Nueva Transacción
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-4">
          <button
            onClick={() => {
              setActiveTab('all');
              setOffset(0);
            }}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'all'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => {
              setActiveTab('ingreso');
              setOffset(0);
            }}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'ingreso'
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Ingresos
          </button>
          <button
            onClick={() => {
              setActiveTab('egreso');
              setOffset(0);
            }}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'egreso'
                ? 'text-red-600 border-b-2 border-red-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Egresos
          </button>
          <button
            onClick={() => {
              setActiveTab('transfer');
              setOffset(0);
            }}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'transfer'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Transferencias
          </button>
        </div>
      </div>

      {/* Initial Balance Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-blue-900">Saldo Inicial de la Cuenta</p>
              <p className="text-xs text-blue-700">Monto con el que se creó la cuenta</p>
            </div>
          </div>
          <p className="text-2xl font-bold text-blue-900">
            {formatCurrency(account.initialBalance, account.currency)}
          </p>
        </div>
      </div>

      {/* Transactions List */}
      <div className="mb-6">
        <TransactionList
          transactions={filteredTransactions}
          onEdit={handleEdit}
          onDelete={handleDelete}
          isLoading={isLoadingTransactions}
        />
      </div>

      {/* Pagination */}
      {transactionsData && transactionsData.total > limit && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Mostrando {offset + 1} a {Math.min(offset + limit, transactionsData.total)} de{' '}
            {transactionsData.total}
          </p>
          <div className="flex gap-2">
            <button
              onClick={handlePreviousPage}
              disabled={offset === 0}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <button
              onClick={handleNextPage}
              disabled={offset + limit >= transactionsData.total}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* Transaction Form Modal */}
      <TransactionFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingTransaction(null);
        }}
        onSubmit={handleSubmitForm}
        editingTransaction={editingTransaction}
        defaultAccountId={accountId}
      />

      {/* Delete Confirmation Modal */}
      {deletingTransaction && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setDeletingTransaction(null)}
          />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Eliminar transacción</h3>
              <p className="text-gray-600 mb-2">
                ¿Estás seguro de que deseas eliminar esta transacción de{' '}
                {formatCurrency(deletingTransaction.amount, account.currency)}?
              </p>
              <p className="text-sm text-gray-500 mb-4">
                <strong>Concepto:</strong> {deletingTransaction.concept}
              </p>
              {deletingTransaction.isTransfer && (
                <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded mb-4">
                  ⚠️ Esta es una transferencia. Al eliminarla se eliminarán ambas transacciones
                  relacionadas y se actualizarán los saldos de ambas cuentas.
                </p>
              )}
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded mb-4">
                💡 El saldo de la cuenta se ajustará automáticamente.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeletingTransaction(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        defaultFromAccountId={accountId}
      />
    </div>
  );
}
