/**
 * AccountHeader Component
 * Sprint 9 - US-S9-008
 *
 * Header component for account detail screen showing balance and stats
 */

import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AccountWithStats } from '../../api/accounts.api';
import { formatCurrency } from '../../utils/currency';

interface AccountHeaderProps {
  account: AccountWithStats;
}

export function AccountHeader({ account }: AccountHeaderProps) {
  const typeLabels: Record<string, string> = {
    efectivo: 'Efectivo',
    banco: 'Banco',
    billetera_digital: 'Billetera Digital',
    tarjeta: 'Tarjeta',
  };

  const typeLabel = typeLabels[account.type] || account.type;

  // Calculate balance change
  const balanceChange = account.currentBalance - account.initialBalance;
  const hasGained = balanceChange > 0;

  return (
    <View style={[styles.container, { backgroundColor: account.color || '#4F46E5' }]}>
      {/* Account Icon and Name */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name={account.icon as any} size={32} color="#FFFFFF" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.name}>{account.name}</Text>
          <Text style={styles.type}>{typeLabel}</Text>
        </View>
      </View>

      {/* Current Balance */}
      <View style={styles.balanceSection}>
        <Text style={styles.balanceLabel}>Saldo Actual</Text>
        <Text style={styles.balanceAmount}>
          {formatCurrency(account.currentBalance, account.currency, { decimals: 2 })}
        </Text>
        {balanceChange !== 0 && (
          <View style={styles.balanceChange}>
            <Ionicons
              name={hasGained ? 'trending-up' : 'trending-down'}
              size={16}
              color="#FFFFFF"
            />
            <Text style={styles.balanceChangeText}>
              {hasGained ? '+' : ''}
              {formatCurrency(balanceChange, account.currency, { decimals: 2 })}
            </Text>
            <Text style={styles.balanceChangeLabel}>desde saldo inicial</Text>
          </View>
        )}
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {/* Initial Balance */}
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Saldo Inicial</Text>
          <Text style={styles.statValue}>
            {formatCurrency(account.initialBalance, account.currency, { decimals: 2 })}
          </Text>
        </View>

        {/* Total Income */}
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Ingresos</Text>
          <Text style={[styles.statValue, styles.incomeValue]}>
            {formatCurrency(account.totalIncome, account.currency, { decimals: 2 })}
          </Text>
        </View>

        {/* Total Expenses */}
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Egresos</Text>
          <Text style={[styles.statValue, styles.expenseValue]}>
            {formatCurrency(account.totalExpenses, account.currency, { decimals: 2 })}
          </Text>
        </View>

        {/* Transaction Count */}
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Transacciones</Text>
          <Text style={styles.statValue}>{account.transactionCount}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  type: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  balanceSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
    fontWeight: '500',
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  balanceChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  balanceChangeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  balanceChangeLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 6,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  incomeValue: {
    color: '#D1FAE5', // Light green tint
  },
  expenseValue: {
    color: '#FEE2E2', // Light red tint
  },
});
