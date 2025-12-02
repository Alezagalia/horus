/**
 * MonthlyExpensesScreen
 * Sprint 10 - US-090
 *
 * Screen to display monthly expense instances (pendiente/pagado)
 */

import { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getMonthlyExpenses, type MonthlyExpenseInstance } from '../api/monthlyExpenses.api';
import { MonthSelector } from '../components/finance/MonthSelector';
import { MonthlyExpenseCard } from '../components/finance/MonthlyExpenseCard';
import { EmptyState } from '../components/common/EmptyState';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type RootStackParamList = {
  MonthlyExpenses: undefined;
  PayMonthlyExpense: { expenseId: string };
};

type Props = NativeStackScreenProps<RootStackParamList, 'MonthlyExpenses'>;

export function MonthlyExpensesScreen({ navigation }: Props) {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [showPaidCollapsed, setShowPaidCollapsed] = useState(false);

  // Fetch monthly expenses for selected month
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['monthlyExpenses', selectedMonth, selectedYear],
    queryFn: () => getMonthlyExpenses(selectedMonth, selectedYear),
  });

  const expenses = data?.monthlyExpenses || [];

  // Separate pending and paid expenses
  const { pendingExpenses, paidExpenses } = useMemo(() => {
    const pending = expenses.filter((e) => e.status === 'pendiente');
    const paid = expenses.filter((e) => e.status === 'pagado');
    return { pendingExpenses: pending, paidExpenses: paid };
  }, [expenses]);

  // Calculate totals
  const totals = useMemo(() => {
    const totalPending = pendingExpenses.reduce((sum, e) => sum + (e.previousAmount || 0), 0);
    const totalPaid = paidExpenses.reduce((sum, e) => sum + e.amount, 0);

    return {
      totalPending,
      totalPaid,
      difference: totalPaid - totalPending,
    };
  }, [pendingExpenses, paidExpenses]);

  const handleMonthChange = (month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
  };

  const handleMarkAsPaid = (expense: MonthlyExpenseInstance) => {
    // Navigate to pay screen
    navigation.navigate('PayMonthlyExpense', { expenseId: expense.id });
  };

  const handleExpensePress = (expense: MonthlyExpenseInstance) => {
    if (expense.status === 'pagado') {
      // Show details or edit modal
      // TODO: Implement detail/edit screen
      // eslint-disable-next-line no-console
      console.log('View expense details:', expense.id);
    }
  };

  const renderPendingExpense = ({ item }: { item: MonthlyExpenseInstance }) => (
    <MonthlyExpenseCard
      expense={item}
      onMarkAsPaid={handleMarkAsPaid}
      onPress={handleExpensePress}
    />
  );

  const renderPaidExpense = ({ item }: { item: MonthlyExpenseInstance }) => (
    <MonthlyExpenseCard expense={item} onPress={handleExpensePress} />
  );

  const renderPendingEmpty = () => (
    <EmptyState
      icon="🎉"
      title="No hay gastos pendientes"
      description="¡Todos los gastos del mes están al día!"
    />
  );

  const renderPaidEmpty = () => (
    <View style={styles.emptySection}>
      <Text style={styles.emptyText}>No has pagado ningún gasto aún</Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Cargando gastos...</Text>
      </View>
    );
  }

  const formatCurrency = (amount: number) => {
    return `$ ${amount.toLocaleString('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <View style={styles.container}>
      {/* Month Selector */}
      <MonthSelector month={selectedMonth} year={selectedYear} onMonthChange={handleMonthChange} />

      <FlatList
        data={[]}
        renderItem={null}
        keyExtractor={() => ''}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        ListHeaderComponent={
          <>
            {/* PENDING SECTION */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>PENDIENTES ({pendingExpenses.length})</Text>
              {pendingExpenses.length === 0 ? (
                renderPendingEmpty()
              ) : (
                <FlatList
                  data={pendingExpenses}
                  renderItem={renderPendingExpense}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                />
              )}
            </View>

            {/* PAID SECTION (Collapsable) */}
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.sectionHeader}
                onPress={() => setShowPaidCollapsed(!showPaidCollapsed)}
                activeOpacity={0.7}
              >
                <Text style={styles.sectionTitle}>PAGADOS ({paidExpenses.length})</Text>
                <Text style={styles.collapseIcon}>{showPaidCollapsed ? '▼' : '▲'}</Text>
              </TouchableOpacity>

              {!showPaidCollapsed && (
                <>
                  {paidExpenses.length === 0 ? (
                    renderPaidEmpty()
                  ) : (
                    <FlatList
                      data={paidExpenses}
                      renderItem={renderPaidExpense}
                      keyExtractor={(item) => item.id}
                      scrollEnabled={false}
                    />
                  )}
                </>
              )}
            </View>
          </>
        }
      />

      {/* Footer: Summary */}
      <View style={styles.footer}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Pendiente (estimado):</Text>
          <Text style={styles.summaryPending}>{formatCurrency(totals.totalPending)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Pagado:</Text>
          <Text style={styles.summaryPaid}>{formatCurrency(totals.totalPaid)}</Text>
        </View>
        <View style={[styles.summaryRow, styles.summaryRowTotal]}>
          <Text style={styles.summaryLabelBold}>Diferencia:</Text>
          <Text
            style={[
              styles.summaryTotal,
              totals.difference > 0 && styles.summaryPositive,
              totals.difference < 0 && styles.summaryNegative,
            ]}
          >
            {formatCurrency(Math.abs(totals.difference))}
            {totals.difference > 0 ? ' ↑' : totals.difference < 0 ? ' ↓' : ''}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  collapseIcon: {
    fontSize: 16,
    color: '#666',
  },
  emptySection: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  footer: {
    backgroundColor: '#FFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryRowTotal: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryLabelBold: {
    fontSize: 15,
    fontWeight: '700',
    color: '#212121',
  },
  summaryPending: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF9800',
  },
  summaryPaid: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  summaryTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212121',
  },
  summaryPositive: {
    color: '#4CAF50',
  },
  summaryNegative: {
    color: '#F44336',
  },
});
