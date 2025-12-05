/**
 * Accounts Page
 * Sprint 13 - US-119
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import type { Account } from '@horus/shared';
import {
  useAccounts,
  useCreateAccount,
  useUpdateAccount,
  useDeactivateAccount,
} from '@/hooks/useAccounts';
import { TotalBalanceCard } from '@/components/accounts/TotalBalanceCard';
import { AccountCard } from '@/components/accounts/AccountCard';
import { MonthStatsCards } from '@/components/accounts/MonthStatsCards';
import { AccountFormModal } from '@/components/accounts/AccountFormModal';
import { TransferModal } from '@/components/transfers/TransferModal';

export function AccountsPage() {
  const navigate = useNavigate();
  const { data: accounts = [], isLoading } = useAccounts();
  const createMutation = useCreateAccount();
  const updateMutation = useUpdateAccount();
  const deactivateMutation = useDeactivateAccount();

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [deactivatingAccount, setDeactivatingAccount] = useState<Account | null>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferFromAccount, setTransferFromAccount] = useState<Account | null>(null);

  const handleCreateNew = () => {
    setEditingAccount(null);
    setIsFormModalOpen(true);
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setIsFormModalOpen(true);
  };

  const handleSubmitForm = (data: any) => {
    if (editingAccount) {
      // Edit
      updateMutation.mutate(
        {
          id: editingAccount.id,
          data: {
            name: data.name,
            color: data.color,
            icon: data.icon,
          },
        },
        {
          onSuccess: () => {
            setIsFormModalOpen(false);
            setEditingAccount(null);
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

  const handleDeactivate = (account: Account) => {
    setDeactivatingAccount(account);
  };

  const handleTransfer = (account: Account) => {
    setTransferFromAccount(account);
    setIsTransferModalOpen(true);
  };

  const confirmDeactivate = () => {
    if (deactivatingAccount) {
      deactivateMutation.mutate(deactivatingAccount.id, {
        onSuccess: () => {
          setDeactivatingAccount(null);
        },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando cuentas...</p>
        </div>
      </div>
    );
  }

  // Ensure accounts is an array before filtering
  const accountsList = Array.isArray(accounts) ? accounts : [];
  const activeAccounts = accountsList.filter((acc) => acc.isActive);

  return (
    <div>
      <Toaster position="top-right" />

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Finanzas</h1>
            <p className="text-gray-600 mt-1">Gestiona tus cuentas y saldo</p>
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
              Nueva Cuenta
            </button>
          </div>
        </div>
      </div>

      {/* Total Balance Section */}
      <div className="mb-8">
        <TotalBalanceCard accounts={activeAccounts} />
      </div>

      {/* Month Stats Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Estadísticas del Mes</h2>
        <MonthStatsCards />
      </div>

      {/* Accounts List Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Mis Cuentas</h2>

        {activeAccounts.length === 0 ? (
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
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No tienes cuentas aún</h3>
            <p className="text-gray-600 mb-4">
              Crea tu primera cuenta para empezar a gestionar tus finanzas
            </p>
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
              Nueva Cuenta
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeAccounts.map((account) => (
              <div key={account.id} onClick={() => navigate(`/accounts/${account.id}`)}>
                <AccountCard
                  account={account}
                  onEdit={handleEdit}
                  onDeactivate={handleDeactivate}
                  onTransfer={handleTransfer}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Account Form Modal */}
      <AccountFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingAccount(null);
        }}
        onSubmit={handleSubmitForm}
        editingAccount={editingAccount}
      />

      {/* Deactivate Confirmation Modal */}
      {deactivatingAccount && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setDeactivatingAccount(null)}
          />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Desactivar cuenta</h3>
              <p className="text-gray-600 mb-4">
                ¿Estás seguro de que deseas desactivar la cuenta "{deactivatingAccount.name}"?
              </p>
              <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded mb-4">
                ⚠️ La cuenta se ocultará pero sus transacciones se mantendrán en el historial.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeactivatingAccount(null)}
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

      {/* Transfer Modal */}
      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => {
          setIsTransferModalOpen(false);
          setTransferFromAccount(null);
        }}
        defaultFromAccountId={transferFromAccount?.id}
      />
    </div>
  );
}
