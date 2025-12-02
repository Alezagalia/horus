/**
 * AccountDetailScreen - Complete Implementation
 * Sprint 9 - US-S9-008
 *
 * Screen showing account details with transaction history
 */

import { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { getAccountById } from '../api/accounts.api';
import { getAccountTransactions, Transaction } from '../api/transactions.api';
import { AccountHeader } from '../components/accounts/AccountHeader';
import { TransactionItem } from '../components/transactions/TransactionItem';
import { formatMonthYearHeader } from '../utils/date';

interface AccountDetailScreenProps {
  // TODO: Replace with route params when navigation is implemented
  accountId?: string;
}

export function AccountDetailScreen({ accountId = 'test-account-id' }: AccountDetailScreenProps) {
  const [filter, setFilter] = useState<'all' | 'ingreso' | 'egreso'>('all');

  // Fetch account details
  const {
    data: account,
    isLoading: isLoadingAccount,
    error: accountError,
    refetch: refetchAccount,
  } = useQuery({
    queryKey: ['account', accountId],
    queryFn: () => getAccountById(accountId),
  });

  // Fetch account transactions
  const {
    data: transactionsData,
    isLoading: isLoadingTransactions,
    error: transactionsError,
    refetch: refetchTransactions,
  } = useQuery({
    queryKey: ['transactions', accountId, filter],
    queryFn: () =>
      getAccountTransactions(accountId, {
        type: filter === 'all' ? undefined : filter,
        sortBy: 'date',
        sortOrder: 'desc',
        limit: 100,
      }),
  });

  const handleRefresh = async () => {
    await Promise.all([refetchAccount(), refetchTransactions()]);
  };

  const handleTransactionPress = (transaction: Transaction) => {
    // TODO: Navigate to transaction detail or edit screen
    console.log('Transaction pressed:', transaction.id);
  };

  const handleAddTransaction = () => {
    // TODO: Navigate to CreateTransactionScreen with accountId
    console.log('Add transaction for account:', accountId);
  };

  const handleEditAccount = () => {
    // TODO: Navigate to EditAccountScreen
    console.log('Edit account:', accountId);
  };

  // Loading state
  if (isLoadingAccount || isLoadingTransactions) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Cargando cuenta...</Text>
      </View>
    );
  }

  // Error state
  if (accountError || transactionsError) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle" size={48} color="#EF4444" />
        <Text style={styles.errorText}>Error al cargar la cuenta</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // No account found
  if (!account) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="folder-open" size={48} color="#9CA3AF" />
        <Text style={styles.errorText}>Cuenta no encontrada</Text>
      </View>
    );
  }

  const transactions = transactionsData?.transactions || [];
  const isRefreshing = false; // Controlled by React Query

  // Group transactions by month
  const groupedTransactions = groupTransactionsByMonth(transactions);

  return (
    <View style={styles.container}>
      <FlatList
        data={groupedTransactions}
        keyExtractor={(item) => item.header}
        renderItem={({ item }) => (
          <View>
            {/* Month Header */}
            <Text style={styles.monthHeader}>{item.header}</Text>

            {/* Transactions in this month */}
            {item.transactions.map((transaction) => (
              <TransactionItem
                key={transaction.id}
                transaction={transaction}
                currency={account.currency}
                onPress={handleTransactionPress}
              />
            ))}
          </View>
        )}
        ListHeaderComponent={
          <View>
            {/* Account Header */}
            <AccountHeader account={account} />

            {/* Filter Tabs */}
            <View style={styles.filterContainer}>
              <TouchableOpacity
                style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
                onPress={() => setFilter('all')}
              >
                <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
                  Todas
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterTab, filter === 'ingreso' && styles.filterTabActive]}
                onPress={() => setFilter('ingreso')}
              >
                <Text style={[styles.filterText, filter === 'ingreso' && styles.filterTextActive]}>
                  Ingresos
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterTab, filter === 'egreso' && styles.filterTabActive]}
                onPress={() => setFilter('egreso')}
              >
                <Text style={[styles.filterText, filter === 'egreso' && styles.filterTextActive]}>
                  Egresos
                </Text>
              </TouchableOpacity>
            </View>

            {/* Transactions Section Header */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Transacciones</Text>
              <Text style={styles.transactionCount}>
                {transactions.length} {transactions.length === 1 ? 'transacción' : 'transacciones'}
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>Sin transacciones</Text>
            <Text style={styles.emptySubtitle}>
              {filter === 'all'
                ? 'No hay transacciones en esta cuenta'
                : filter === 'ingreso'
                  ? 'No hay ingresos registrados'
                  : 'No hay egresos registrados'}
            </Text>
            <TouchableOpacity style={styles.addButton} onPress={handleAddTransaction}>
              <Ionicons name="add" size={24} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Agregar Transacción</Text>
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#4F46E5']}
          />
        }
      />

      {/* Floating Action Buttons */}
      <View style={styles.fabContainer}>
        {/* Edit Account FAB */}
        <TouchableOpacity style={styles.fabSecondary} onPress={handleEditAccount}>
          <Ionicons name="create-outline" size={24} color="#4F46E5" />
        </TouchableOpacity>

        {/* Add Transaction FAB */}
        <TouchableOpacity style={styles.fab} onPress={handleAddTransaction}>
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

/**
 * Group transactions by month/year
 */
interface GroupedTransactions {
  header: string;
  transactions: Transaction[];
}

function groupTransactionsByMonth(transactions: Transaction[]): GroupedTransactions[] {
  const groups: Record<string, Transaction[]> = {};

  transactions.forEach((transaction) => {
    const header = formatMonthYearHeader(transaction.date);
    if (!groups[header]) {
      groups[header] = [];
    }
    groups[header].push(transaction);
  });

  // Convert to array and sort by date (most recent first)
  return Object.entries(groups)
    .map(([header, transactions]) => ({
      header,
      transactions,
    }))
    .sort((a, b) => {
      const dateA = new Date(a.transactions[0].date);
      const dateB = new Date(b.transactions[0].date);
      return dateB.getTime() - dateA.getTime();
    });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 100,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#FFFFFF',
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  filterTabActive: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterTextActive: {
    color: '#4F46E5',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
    backgroundColor: '#F9FAFB',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  transactionCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  monthHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    flexDirection: 'column',
    gap: 12,
    alignItems: 'flex-end',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabSecondary: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    borderWidth: 2,
    borderColor: '#4F46E5',
  },
});
