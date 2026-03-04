/**
 * TransactionsScreen - Unified Transactions View
 * Sprint 2 - Finance Integration
 *
 * Displays all transactions (ingreso/egreso) with filters:
 * - Date range
 * - Type filter
 * - Account filter
 * - Search
 * - Grouped by date
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { format, startOfMonth, endOfMonth, isToday, isYesterday, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  getTransactions,
  type Transaction,
  type TransactionType,
  type GetTransactionsParams,
} from '../api/transactions.api';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type FinanceStackParamList = {
  Transactions: undefined;
  CreateTransaction: undefined;
  // Add other routes as needed
};

type Props = NativeStackScreenProps<FinanceStackParamList, 'Transactions'>;

type FilterType = 'all' | TransactionType;

interface GroupedTransactions {
  label: string;
  date: Date;
  transactions: Transaction[];
}

export const TransactionsScreen: React.FC<Props> = ({ navigation }) => {
  // Date range: default to current month
  const today = new Date();
  const [dateFrom] = useState(format(startOfMonth(today), 'yyyy-MM-dd'));
  const [dateTo] = useState(format(endOfMonth(today), 'yyyy-MM-dd'));
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Build query params
  const params: GetTransactionsParams = {
    startDate: dateFrom,
    endDate: dateTo,
    ...(filterType !== 'all' && { type: filterType }),
    limit: 100,
    sortBy: 'date',
    sortOrder: 'desc',
  };

  // Fetch transactions
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['transactions', params],
    queryFn: () => getTransactions(params),
  });

  const transactions = data?.transactions || [];

  // Filter by search term
  const filteredTransactions = useMemo(() => {
    if (!searchTerm) return transactions;

    const term = searchTerm.toLowerCase();
    return transactions.filter(
      (t) =>
        t.concept.toLowerCase().includes(term) ||
        t.notes?.toLowerCase().includes(term) ||
        t.category?.name.toLowerCase().includes(term)
    );
  }, [transactions, searchTerm]);

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const groups: GroupedTransactions[] = [];

    filteredTransactions.forEach((transaction) => {
      const dateStr = transaction.date.split('T')[0];
      const [year, month, day] = dateStr.split('-').map(Number);
      const localDate = new Date(year, month - 1, day, 0, 0, 0, 0);

      let group = groups.find((g) => isSameDay(g.date, localDate));

      if (!group) {
        let label: string;
        if (isToday(localDate)) {
          label = 'Hoy';
        } else if (isYesterday(localDate)) {
          label = 'Ayer';
        } else {
          label = format(localDate, "EEEE d 'de' MMMM", { locale: es });
          label = label.charAt(0).toUpperCase() + label.slice(1);
        }

        group = { label, date: localDate, transactions: [] };
        groups.push(group);
      }

      group.transactions.push(transaction);
    });

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

  // Pull to refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Render transaction item
  const renderTransaction = (transaction: Transaction) => {
    const isIncome = transaction.type === 'ingreso';
    const isTransfer = transaction.isTransfer;

    let icon: string;
    let amountColor: string;
    if (isTransfer) {
      icon = 'swap-horizontal';
      amountColor = '#3B82F6';
    } else if (isIncome) {
      icon = 'arrow-down-circle';
      amountColor = '#10B981';
    } else {
      icon = 'arrow-up-circle';
      amountColor = '#EF4444';
    }

    return (
      <TouchableOpacity
        key={transaction.id}
        style={styles.transactionItem}
        activeOpacity={0.7}
        onPress={() => {
          /* TODO: Navigate to transaction detail */
        }}
      >
        <View style={styles.transactionLeft}>
          <View style={[styles.iconContainer, { backgroundColor: `${amountColor}15` }]}>
            <Ionicons name={icon as any} size={24} color={amountColor} />
          </View>
          <View style={styles.transactionInfo}>
            <Text style={styles.transactionConcept}>{transaction.concept}</Text>
            <View style={styles.transactionMeta}>
              {transaction.category && (
                <Text style={styles.transactionCategory}>
                  {transaction.category.icon} {transaction.category.name}
                </Text>
              )}
              {transaction.account && (
                <Text style={styles.transactionAccount}>• {transaction.account.name}</Text>
              )}
            </View>
          </View>
        </View>
        <View style={styles.transactionRight}>
          <Text style={[styles.transactionAmount, { color: amountColor }]}>
            {isIncome && !isTransfer ? '+' : isTransfer ? '' : '-'}
            {transaction.account?.currency || '$'}{' '}
            {transaction.amount.toLocaleString('es-AR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Render date group
  const renderGroup = ({ item }: { item: GroupedTransactions }) => (
    <View style={styles.group}>
      <Text style={styles.groupHeader}>{item.label}</Text>
      {item.transactions.map(renderTransaction)}
    </View>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="receipt-outline" size={80} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>No hay transacciones</Text>
      <Text style={styles.emptyDescription}>
        {searchTerm
          ? 'No se encontraron transacciones con ese criterio'
          : 'Crea tu primera transacción para comenzar'}
      </Text>
      {!searchTerm && (
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={() => navigation.navigate('CreateTransaction')}
        >
          <Text style={styles.emptyButtonText}>Nueva transacción</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Loading state
  if (isLoading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Cargando transacciones...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar transacciones..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholderTextColor="#9CA3AF"
        />
        {searchTerm ? (
          <TouchableOpacity onPress={() => setSearchTerm('')}>
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Type Filter */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filterType === 'all' && styles.filterButtonActive]}
          onPress={() => setFilterType('all')}
        >
          <Text
            style={[styles.filterButtonText, filterType === 'all' && styles.filterButtonTextActive]}
          >
            Todas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filterType === 'ingreso' && styles.filterButtonActive]}
          onPress={() => setFilterType('ingreso')}
        >
          <Text
            style={[
              styles.filterButtonText,
              filterType === 'ingreso' && styles.filterButtonTextActive,
            ]}
          >
            Ingresos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filterType === 'egreso' && styles.filterButtonActive]}
          onPress={() => setFilterType('egreso')}
        >
          <Text
            style={[
              styles.filterButtonText,
              filterType === 'egreso' && styles.filterButtonTextActive,
            ]}
          >
            Egresos
          </Text>
        </TouchableOpacity>
      </View>

      {/* Totals Summary */}
      {filteredTransactions.length > 0 && (
        <View style={styles.summaryContainer}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Ingresos</Text>
            <Text style={[styles.summaryValue, styles.summaryIncome]}>
              +$ {totals.income.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Egresos</Text>
            <Text style={[styles.summaryValue, styles.summaryExpense]}>
              -$ {totals.expenses.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Balance</Text>
            <Text
              style={[
                styles.summaryValue,
                styles.summaryBalance,
                totals.balance < 0 && styles.summaryNegative,
              ]}
            >
              $ {totals.balance.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </View>
      )}

      {/* Transactions List */}
      <FlatList
        data={groupedTransactions}
        renderItem={renderGroup}
        keyExtractor={(item) => item.label}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#4F46E5']}
            tintColor="#4F46E5"
          />
        }
        ListEmptyComponent={renderEmptyState}
      />

      {/* FAB: Create Transaction */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateTransaction')}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

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
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterButtonActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  summaryContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  summaryIncome: {
    color: '#10B981',
  },
  summaryExpense: {
    color: '#EF4444',
  },
  summaryBalance: {
    color: '#4F46E5',
  },
  summaryNegative: {
    color: '#EF4444',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  group: {
    marginBottom: 24,
  },
  groupHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionConcept: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  transactionCategory: {
    fontSize: 12,
    color: '#6B7280',
  },
  transactionAccount: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
