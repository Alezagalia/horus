/**
 * AccountCard Component
 * Sprint 9 - US-078
 * Sprint 12 - US-108: Optimized with React.memo for performance
 *
 * Card component to display account information
 */

import { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency } from '../../utils/currency';
import type { AccountWithStats } from '../../api/accounts.api';

interface AccountCardProps {
  account: AccountWithStats;
  onPress?: () => void;
}

// Account type labels and colors
const ACCOUNT_TYPE_CONFIG = {
  efectivo: {
    label: 'Efectivo',
    color: '#10B981',
    bgColor: '#D1FAE5',
  },
  banco: {
    label: 'Banco',
    color: '#3B82F6',
    bgColor: '#DBEAFE',
  },
  billetera_digital: {
    label: 'Billetera Digital',
    color: '#8B5CF6',
    bgColor: '#EDE9FE',
  },
  tarjeta: {
    label: 'Tarjeta',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
  },
};

export const AccountCard = memo(function AccountCard({ account, onPress }: AccountCardProps) {
  const config = ACCOUNT_TYPE_CONFIG[account.type];

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: config.bgColor }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Header: Icon, Name, Type Badge */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons
            name={account.icon as keyof typeof Ionicons.glyphMap}
            size={24}
            color={config.color}
          />
        </View>
        <View style={styles.headerContent}>
          <Text style={styles.accountName} numberOfLines={1}>
            {account.name}
          </Text>
          <View style={[styles.typeBadge, { backgroundColor: config.color }]}>
            <Text style={styles.typeLabel}>{config.label}</Text>
          </View>
        </View>
      </View>

      {/* Balance */}
      <View style={styles.balanceContainer}>
        <Text style={styles.balanceLabel}>Saldo actual</Text>
        <Text style={[styles.balance, { color: config.color }]}>
          {formatCurrency(account.currentBalance, account.currency)}
        </Text>
      </View>

      {/* Stats (optional) */}
      {account.transactionCount > 0 && (
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Ionicons name="arrow-up-circle" size={14} color="#10B981" />
            <Text style={styles.statText}>
              {formatCurrency(account.totalIncome, account.currency, {
                showSymbol: false,
                decimals: 0,
              })}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="arrow-down-circle" size={14} color="#EF4444" />
            <Text style={styles.statText}>
              {formatCurrency(account.totalExpenses, account.currency, {
                showSymbol: false,
                decimals: 0,
              })}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="receipt" size={14} color="#6B7280" />
            <Text style={styles.statText}>{account.transactionCount}</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  accountName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  balanceContainer: {
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  balance: {
    fontSize: 24,
    fontWeight: '700',
  },
  stats: {
    flexDirection: 'row',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
    fontWeight: '500',
  },
});
