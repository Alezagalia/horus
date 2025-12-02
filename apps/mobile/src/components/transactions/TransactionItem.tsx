/**
 * TransactionItem Component
 * Sprint 9 - US-S9-008
 *
 * Individual transaction item for list display
 */

import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Transaction } from '../../api/transactions.api';
import { formatCurrency } from '../../utils/currency';
import { formatDateRelative } from '../../utils/date';

interface TransactionItemProps {
  transaction: Transaction;
  currency: string;
  onPress?: (transaction: Transaction) => void;
  showAccount?: boolean; // Show account name if viewing all transactions
}

export function TransactionItem({
  transaction,
  currency,
  onPress,
  showAccount = false,
}: TransactionItemProps) {
  const isIncome = transaction.type === 'ingreso';
  const isTransfer = transaction.isTransfer;

  // Determine display values
  const amountColor = isIncome ? '#10B981' : '#EF4444'; // Green for income, red for expense
  const amountPrefix = isIncome ? '+' : '-';
  const icon = getCategoryIcon(transaction);
  const iconColor = transaction.category?.color || '#6B7280';

  const handlePress = () => {
    onPress?.(transaction);
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      {/* Left: Icon */}
      <View style={[styles.iconContainer, { backgroundColor: `${iconColor}15` }]}>
        <Ionicons name={icon as any} size={24} color={iconColor} />
      </View>

      {/* Center: Details */}
      <View style={styles.details}>
        <Text style={styles.concept} numberOfLines={1}>
          {transaction.concept}
        </Text>
        <View style={styles.metadata}>
          {isTransfer && (
            <View style={styles.transferBadge}>
              <Ionicons name="swap-horizontal" size={12} color="#6366F1" />
              <Text style={styles.transferText}>Transferencia</Text>
            </View>
          )}
          {!isTransfer && transaction.category && (
            <Text style={styles.category} numberOfLines={1}>
              {transaction.category.name}
            </Text>
          )}
          {showAccount && transaction.account && (
            <Text style={styles.accountName} numberOfLines={1}>
              {transaction.account.name}
            </Text>
          )}
        </View>
        <Text style={styles.date}>{formatDateRelative(transaction.date)}</Text>
      </View>

      {/* Right: Amount */}
      <View style={styles.amountContainer}>
        <Text style={[styles.amount, { color: amountColor }]}>
          {amountPrefix}
          {formatCurrency(Number(transaction.amount), currency, { decimals: 2 })}
        </Text>
        {isTransfer && transaction.targetAccount && (
          <Text style={styles.targetAccount} numberOfLines={1}>
            → {transaction.targetAccount.name}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

/**
 * Get icon for transaction based on type and category
 */
function getCategoryIcon(transaction: Transaction): string {
  if (transaction.isTransfer) {
    return 'swap-horizontal';
  }

  if (transaction.category?.icon) {
    return transaction.category.icon;
  }

  // Default icons based on type
  return transaction.type === 'ingreso' ? 'arrow-down-circle' : 'arrow-up-circle';
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  details: {
    flex: 1,
    marginRight: 12,
  },
  concept: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    gap: 8,
  },
  category: {
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
  },
  accountName: {
    fontSize: 13,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  transferBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  transferText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6366F1',
  },
  date: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  targetAccount: {
    fontSize: 11,
    color: '#6B7280',
    maxWidth: 100,
  },
});
