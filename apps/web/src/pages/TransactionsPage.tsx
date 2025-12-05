/**
 * Transactions Page - Unified Movements View
 * Sprint 13 - US-120
 * UX: Option B - Unified movements page with filters
 */

import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, subMonths, isToday, isYesterday, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Toaster } from 'react-hot-toast';
import type { Transaction, TransactionType, GetTransactionsQuery } from '@horus/shared';
import { useTransactions, useDeleteTransaction, useCreateTransaction, useUpdateTransaction } from '@/hooks/useTransactions';
import { useAccounts } from '@/hooks/useAccounts';
import { useCategories } from '@/hooks/useCategories';
import { formatCurrency } from '@/utils/currency';
import { TransactionFormModal, type TransactionFormData } from '@/components/transactions/TransactionFormModal';

type FilterType = 'all' | TransactionType;

export function TransactionsPage() {
  // Date range: default to current month
  const today = new Date();
  const [dateFrom, setDateFrom] = useState(format(startOfMonth(today), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(endOfMonth(today), 'yyyy-MM-dd'));
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterAccountId, setFilterAccountId] = useState<string>('');
  const [filterCategoryId, setFilterCategoryId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [defaultType, setDefaultType] = useState<TransactionType>('egreso');
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);

  // Queries
  const query: GetTransactionsQuery = {
    from: dateFrom,
    to: dateTo,
    ...(filterType !== 'all' && { type: filterType }),
    ...(filterAccountId && { accountId: filterAccountId }),
    ...(filterCategoryId && { categoryId: filterCategoryId }),
    limit: 100,
  };

  const { data, isLoading } = useTransactions(query);
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();
  const deleteMutation = useDeleteTransaction();
  const createMutation = useCreateTransaction();
  const updateMutation = useUpdateTransaction();

  // Ensure accounts is array
  const accountsList = Array.isArray(accounts) ? accounts : [];
  const activeAccounts = accountsList.filter((acc) => acc.isActive);

  // Filter by search term and group by date
  const filteredTransactions = useMemo(() => {
    let transactions = data?.transactions || [];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      transactions = transactions.filter(
        (t) =>
          t.concept.toLowerCase().includes(term) ||
          t.notes?.toLowerCase().includes(term) ||
          t.category?.name.toLowerCase().includes(term)
      );
    }

    return transactions;
  }, [data?.transactions, searchTerm]);

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const groups: { label: string; date: Date; transactions: Transaction[] }[] = [];

    filteredTransactions.forEach((transaction) => {
      const transDate = new Date(transaction.date);
      let group = groups.find((g) => isSameDay(g.date, transDate));

      if (!group) {
        let label: string;
        if (isToday(transDate)) {
          label = 'Hoy';
        } else if (isYesterday(transDate)) {
          label = 'Ayer';
        } else {
          label = format(transDate, "EEEE d 'de' MMMM", { locale: es });
          label = label.charAt(0).toUpperCase() + label.slice(1);
        }

        group = { label, date: transDate, transactions: [] };
        groups.push(group);
      }

      group.transactions.push(transaction);
    });

    // Sort groups by date (newest first)
    groups.sort((a, b) => b.date.getTime() - a.date.getTime());

    return groups;
  }, [filteredTransactions]);

  // Calculate totals
  const totals = useMemo(() => {
    const income = filteredTransactions
      .filter((t) => t.type === 'ingreso' && !t.isTransfer)
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = filteredTransactions
      .filter((t) => t.type === 'egreso' && !t.isTransfer)
      .reduce((sum, t) => sum + t.amount, 0);
    return { income, expenses, balance: income - expenses };
  }, [filteredTransactions]);

  // Quick date filters
  const setQuickDateFilter = (period: 'thisMonth' | 'lastMonth' | 'last3Months') => {
    const now = new Date();
    switch (period) {
      case 'thisMonth':
        setDateFrom(format(startOfMonth(now), 'yyyy-MM-dd'));
        setDateTo(format(endOfMonth(now), 'yyyy-MM-dd'));
        break;
      case 'lastMonth':
        const lastMonth = subMonths(now, 1);
        setDateFrom(format(startOfMonth(lastMonth), 'yyyy-MM-dd'));
        setDateTo(format(endOfMonth(lastMonth), 'yyyy-MM-dd'));
        break;
      case 'last3Months':
        setDateFrom(format(startOfMonth(subMonths(now, 2)), 'yyyy-MM-dd'));
        setDateTo(format(endOfMonth(now), 'yyyy-MM-dd'));
        break;
    }
  };

  const handleNewTransaction = (type: TransactionType) => {
    setEditingTransaction(null);
    setDefaultType(type);
    setIsFormModalOpen(true);
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setDefaultType(transaction.type);
    setIsFormModalOpen(true);
  };

  const handleDelete = () => {
    if (deletingTransaction) {
      deleteMutation.mutate(deletingTransaction.id, {
        onSuccess: () => setDeletingTransaction(null),
      });
    }
  };

  const handleFormSubmit = (data: TransactionFormData) => {
    // Agregar hora al mediodía para evitar problemas de zona horaria
    const dateWithTime = `${data.date}T12:00:00`;
    const payload = {
      type: data.type,
      accountId: data.accountId,
      categoryId: data.categoryId,
      amount: data.amount,
      concept: data.concept,
      date: new Date(dateWithTime).toISOString(),
      notes: data.notes || undefined,
    };

    if (editingTransaction) {
      updateMutation.mutate(
        { id: editingTransaction.id, data: payload },
        {
          onSuccess: () => {
            setIsFormModalOpen(false);
            setEditingTransaction(null);
          },
        }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          setIsFormModalOpen(false);
        },
      });
    }
  };

  const clearFilters = () => {
    setFilterType('all');
    setFilterAccountId('');
    setFilterCategoryId('');
    setSearchTerm('');
    setDateFrom(format(startOfMonth(today), 'yyyy-MM-dd'));
    setDateTo(format(endOfMonth(today), 'yyyy-MM-dd'));
  };

  const hasActiveFilters =
    filterType !== 'all' || filterAccountId || filterCategoryId || searchTerm;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando movimientos...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* @ts-expect-error - react-hot-toast types */}
      <Toaster position="top-right" />

      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Movimientos</h1>
            <p className="text-gray-600 mt-1">Registro de ingresos y egresos</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleNewTransaction('ingreso')}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Ingreso
            </button>
            <button
              onClick={() => handleNewTransaction('egreso')}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
              Egreso
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Ingresos</p>
              <p className="text-xl font-bold text-green-600">+{formatCurrency(totals.income, 'ARS')}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Egresos</p>
              <p className="text-xl font-bold text-red-600">-{formatCurrency(totals.expenses, 'ARS')}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full ${totals.balance >= 0 ? 'bg-blue-100' : 'bg-orange-100'} flex items-center justify-center`}>
              <svg className={`w-5 h-5 ${totals.balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Balance</p>
              <p className={`text-xl font-bold ${totals.balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                {totals.balance >= 0 ? '+' : ''}{formatCurrency(totals.balance, 'ARS')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          {/* Quick date filters */}
          <div className="flex gap-1">
            <button
              onClick={() => setQuickDateFilter('thisMonth')}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Este mes
            </button>
            <button
              onClick={() => setQuickDateFilter('lastMonth')}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Mes anterior
            </button>
            <button
              onClick={() => setQuickDateFilter('last3Months')}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              3 meses
            </button>
          </div>

          <div className="h-6 w-px bg-gray-300 hidden sm:block" />

          {/* Date range */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <span className="text-gray-500">-</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="h-6 w-px bg-gray-300 hidden sm:block" />

          {/* Type filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as FilterType)}
            className={`px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
              filterType !== 'all' ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-gray-300'
            }`}
          >
            <option value="all">Todos los tipos</option>
            <option value="ingreso">Ingresos</option>
            <option value="egreso">Egresos</option>
          </select>

          {/* Account filter */}
          <select
            value={filterAccountId}
            onChange={(e) => setFilterAccountId(e.target.value)}
            className={`px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
              filterAccountId ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-gray-300'
            }`}
          >
            <option value="">Todas las cuentas</option>
            {activeAccounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.icon} {acc.name}
              </option>
            ))}
          </select>

          {/* Category filter */}
          <select
            value={filterCategoryId}
            onChange={(e) => setFilterCategoryId(e.target.value)}
            className={`px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
              filterCategoryId ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-gray-300'
            }`}
          >
            <option value="">Todas las categorías</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>

          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Buscar por concepto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Clear filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-lg border border-gray-200">
        {groupedTransactions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay movimientos</h3>
            <p className="text-gray-600 mb-4">
              {hasActiveFilters
                ? 'No se encontraron movimientos con los filtros seleccionados'
                : 'Registra tu primer ingreso o egreso'}
            </p>
            {!hasActiveFilters && (
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => handleNewTransaction('ingreso')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  + Ingreso
                </button>
                <button
                  onClick={() => handleNewTransaction('egreso')}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  - Egreso
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {groupedTransactions.map((group) => (
              <div key={group.label}>
                {/* Date header */}
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">{group.label}</span>
                </div>

                {/* Transactions for this date */}
                {group.transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer flex items-center gap-4"
                    onClick={() => handleEdit(transaction)}
                  >
                    {/* Icon */}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                        transaction.type === 'ingreso'
                          ? 'bg-green-100'
                          : transaction.isTransfer
                          ? 'bg-blue-100'
                          : 'bg-red-100'
                      }`}
                    >
                      {transaction.isTransfer ? '↔️' : transaction.category?.icon || (transaction.type === 'ingreso' ? '💰' : '💸')}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {transaction.concept}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{transaction.account?.icon} {transaction.account?.name}</span>
                        {transaction.category && (
                          <>
                            <span>•</span>
                            <span>{transaction.category.icon} {transaction.category.name}</span>
                          </>
                        )}
                        {transaction.isTransfer && transaction.targetAccount && (
                          <>
                            <span>→</span>
                            <span>{transaction.targetAccount.icon} {transaction.targetAccount.name}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="text-right">
                      <p
                        className={`text-sm font-semibold ${
                          transaction.type === 'ingreso'
                            ? 'text-green-600'
                            : transaction.isTransfer
                            ? 'text-blue-600'
                            : 'text-red-600'
                        }`}
                      >
                        {transaction.type === 'ingreso' ? '+' : '-'}
                        {formatCurrency(transaction.amount, transaction.account?.currency)}
                      </p>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingTransaction(transaction);
                      }}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transaction count */}
      {filteredTransactions.length > 0 && (
        <div className="mt-4 text-center text-sm text-gray-500">
          Mostrando {filteredTransactions.length} movimientos
        </div>
      )}

      {/* Transaction Form Modal */}
      <TransactionFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingTransaction(null);
        }}
        onSubmit={handleFormSubmit}
        editingTransaction={editingTransaction}
        defaultType={defaultType}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation Modal */}
      {deletingTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Eliminar movimiento</h3>
            <p className="text-gray-600 mb-4">
              ¿Estás seguro de que deseas eliminar "{deletingTransaction.concept}"? Esta acción no se puede deshacer y afectará el saldo de la cuenta.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeletingTransaction(null)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
