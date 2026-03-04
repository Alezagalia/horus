/**
 * FinanceHomeScreen - Main Finance Dashboard
 * Sprint 2 - Finance Integration
 *
 * Central hub for financial management:
 * - Account balances summary
 * - Monthly stats (income, expenses, balance)
 * - Pending monthly expenses
 * - Recent transactions
 * - Quick actions
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { getAccounts } from '../api/accounts.api';
import { getFinanceStats } from '../api/financeStats.api';
import { getCurrentMonthlyExpenses } from '../api/monthlyExpenses.api';
import { TotalBalanceCard } from '../components/accounts/TotalBalanceCard';
import { MonthStatsCard } from '../components/accounts/MonthStatsCard';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type FinanceStackParamList = {
  FinanceHome: undefined;
  Accounts: undefined;
  CreateAccount: undefined;
  AccountDetail: { accountId: string };
  Transactions: undefined;
  CreateTransaction: undefined;
  Transfer: undefined;
  RecurringExpenses: undefined;
  MonthlyExpenses: undefined;
};

type Props = NativeStackScreenProps<FinanceStackParamList, 'FinanceHome'>;

export const FinanceHomeScreen: React.FC<Props> = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);

  // Fetch accounts
  const { data: accountsData, refetch: refetchAccounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: getAccounts,
  });

  // Fetch finance stats
  const { data: stats, isLoading: isLoadingStats, refetch: refetchStats } = useQuery({
    queryKey: ['financeStats'],
    queryFn: () => getFinanceStats(),
  });

  // Fetch current month's pending expenses
  const { data: monthlyExpensesData, refetch: refetchMonthlyExpenses } = useQuery({
    queryKey: ['monthlyExpenses', 'current'],
    queryFn: () => getCurrentMonthlyExpenses({ status: 'pendiente' }),
  });

  const accounts = accountsData?.accounts || [];
  const totalsByCurrency = accountsData?.totalsByCurrency || [];
  const pendingExpenses = monthlyExpensesData?.monthlyExpenses || [];

  // Pull to refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchAccounts(), refetchStats(), refetchMonthlyExpenses()]);
    setRefreshing(false);
  };

  // Calculate pending expenses total (estimated)
  const pendingTotal = useMemo(() => {
    return pendingExpenses.reduce((sum, expense) => sum + (expense.previousAmount || 0), 0);
  }, [pendingExpenses]);

  // Loading state
  if (isLoadingStats && !stats) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Cargando finanzas...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={['#4F46E5']}
          tintColor="#4F46E5"
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>💰 Finanzas</Text>
        <Text style={styles.headerSubtitle}>Gestiona tus cuentas y gastos</Text>
      </View>

      {/* Total Balance */}
      <TotalBalanceCard totalsByCurrency={totalsByCurrency} />

      {/* Month Stats */}
      {stats && (
        <MonthStatsCard
          totalIngresos={stats.totals.totalIngresos}
          totalEgresos={stats.totals.totalEgresos}
          balance={stats.totals.balance}
        />
      )}

      {/* Pending Expenses Card */}
      {pendingExpenses.length > 0 && (
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('MonthlyExpenses')}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Ionicons name="alert-circle" size={24} color="#F59E0B" />
              <Text style={styles.cardTitle}>Gastos Pendientes</Text>
            </View>
            <Text style={styles.cardCount}>{pendingExpenses.length}</Text>
          </View>
          <Text style={styles.pendingAmount}>
            ${pendingTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </Text>
          <Text style={styles.cardSubtitle}>Estimado para este mes</Text>
        </TouchableOpacity>
      )}

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Acciones Rápidas</Text>

        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('CreateTransaction')}
          >
            <Ionicons name="add-circle" size={32} color="#10B981" />
            <Text style={styles.actionText}>Nuevo{'\n'}Ingreso</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('CreateTransaction')}
          >
            <Ionicons name="remove-circle" size={32} color="#EF4444" />
            <Text style={styles.actionText}>Nuevo{'\n'}Egreso</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Transfer')}
          >
            <Ionicons name="swap-horizontal" size={32} color="#3B82F6" />
            <Text style={styles.actionText}>Transferir{'\n'}entre cuentas</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('MonthlyExpenses')}
          >
            <Ionicons name="calendar" size={32} color="#8B5CF6" />
            <Text style={styles.actionText}>Pagar{'\n'}Gasto</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Accounts Summary */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mis Cuentas</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Accounts')}>
            <Text style={styles.seeAllText}>Ver todas →</Text>
          </TouchableOpacity>
        </View>

        {accounts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="wallet-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No tienes cuentas</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => navigation.navigate('CreateAccount')}
            >
              <Text style={styles.emptyButtonText}>Crear cuenta</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {accounts.slice(0, 3).map((account) => (
              <TouchableOpacity
                key={account.id}
                style={styles.accountItem}
                onPress={() => navigation.navigate('AccountDetail', { accountId: account.id })}
              >
                <View style={styles.accountLeft}>
                  <Text style={styles.accountIcon}>{account.icon || '💰'}</Text>
                  <View>
                    <Text style={styles.accountName}>{account.name}</Text>
                    <Text style={styles.accountType}>{account.type}</Text>
                  </View>
                </View>
                <Text style={styles.accountBalance}>
                  {account.currency} {account.currentBalance.toLocaleString('es-AR')}
                </Text>
              </TouchableOpacity>
            ))}
            {accounts.length > 3 && (
              <TouchableOpacity
                style={styles.viewMoreButton}
                onPress={() => navigation.navigate('Accounts')}
              >
                <Text style={styles.viewMoreText}>
                  Ver {accounts.length - 3} cuenta{accounts.length - 3 > 1 ? 's' : ''} más
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>

      {/* Management Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Gestión</Text>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Transactions')}
        >
          <View style={styles.menuItemLeft}>
            <Ionicons name="list" size={24} color="#6366F1" />
            <Text style={styles.menuItemText}>Historial de Transacciones</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('RecurringExpenses')}
        >
          <View style={styles.menuItemLeft}>
            <Ionicons name="repeat" size={24} color="#EC4899" />
            <Text style={styles.menuItemText}>Gastos Recurrentes</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('MonthlyExpenses')}
        >
          <View style={styles.menuItemLeft}>
            <Ionicons name="calendar-outline" size={24} color="#F59E0B" />
            <Text style={styles.menuItemText}>Gastos Mensuales</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  header: {
    padding: 20,
    paddingTop: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  card: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  cardCount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F59E0B',
  },
  pendingAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#F59E0B',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4F46E5',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginTop: 8,
    textAlign: 'center',
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 12,
    marginBottom: 16,
  },
  emptyButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  accountItem: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  accountLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  accountIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  accountType: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  accountBalance: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4F46E5',
  },
  viewMoreButton: {
    padding: 12,
    alignItems: 'center',
  },
  viewMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4F46E5',
  },
  menuItem: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
    marginLeft: 12,
  },
});
