/**
 * AccountsScreen - Complete Implementation
 * Sprint 9 - US-078
 *
 * Main screen for account management with dashboard
 */

import { useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { getAccounts } from '../api/accounts.api';
import { getFinanceStats } from '../api/financeStats.api';
import { AccountCard } from '../components/accounts/AccountCard';
import { TotalBalanceCard } from '../components/accounts/TotalBalanceCard';
import { MonthStatsCard } from '../components/accounts/MonthStatsCard';

export function AccountsScreen() {
  const [refreshing, setRefreshing] = useState(false);

  // Fetch accounts
  const {
    data: accountsData,
    isLoading: isLoadingAccounts,
    refetch: refetchAccounts,
  } = useQuery({
    queryKey: ['accounts'],
    queryFn: getAccounts,
  });

  // Fetch finance stats for current month
  const {
    data: stats,
    isLoading: isLoadingStats,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ['financeStats'],
    queryFn: () => getFinanceStats(),
  });

  const isLoading = isLoadingAccounts || isLoadingStats;
  const accounts = accountsData?.accounts || [];
  const totalsByCurrency = accountsData?.totalsByCurrency || [];

  // Pull to refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchAccounts(), refetchStats()]);
    setRefreshing(false);
  };

  // Navigate to account detail
  const handleAccountPress = (accountId: string) => {
    // TODO: Navigate to AccountDetailScreen
    console.log('Navigate to account detail:', accountId);
  };

  // Navigate to create account
  const handleCreateAccount = () => {
    // TODO: Navigate to CreateAccountScreen
    console.log('Navigate to create account');
  };

  // Loading state
  if (isLoading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Cargando cuentas...</Text>
      </View>
    );
  }

  // Empty state
  if (accounts.length === 0 && !isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="wallet-outline" size={80} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No tienes cuentas</Text>
          <Text style={styles.emptyDescription}>
            Crea tu primera cuenta para comenzar a gestionar tus finanzas
          </Text>
          <TouchableOpacity style={styles.emptyButton} onPress={handleCreateAccount}>
            <Ionicons name="add" size={24} color="#FFFFFF" />
            <Text style={styles.emptyButtonText}>Crear cuenta</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={accounts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AccountCard account={item} onPress={() => handleAccountPress(item.id)} />
        )}
        ListHeaderComponent={
          <>
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

            {/* Accounts Header */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Mis Cuentas</Text>
              <Text style={styles.accountCount}>
                {accounts.length} {accounts.length === 1 ? 'cuenta' : 'cuentas'}
              </Text>
            </View>
          </>
        }
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#4F46E5']}
            tintColor="#4F46E5"
          />
        }
        // Performance optimizations (US-108)
        windowSize={6}
        maxToRenderPerBatch={6}
        updateCellsBatchingPeriod={50}
        removeClippedSubviews={true}
        initialNumToRender={8}
      />

      {/* FAB: Create Account */}
      <TouchableOpacity style={styles.fab} onPress={handleCreateAccount}>
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
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
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100, // Space for FAB
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
  },
  accountCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 22,
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
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
