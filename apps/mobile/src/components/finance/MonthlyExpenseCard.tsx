/**
 * MonthlyExpenseCard Component
 * Sprint 10 - US-090
 *
 * Card displaying monthly expense instance (pendiente or pagado)
 */

import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { MonthlyExpenseInstance } from '../../api/monthlyExpenses.api';

interface MonthlyExpenseCardProps {
  expense: MonthlyExpenseInstance;
  onPress?: (expense: MonthlyExpenseInstance) => void;
  onMarkAsPaid?: (expense: MonthlyExpenseInstance) => void;
}

export const MonthlyExpenseCard = ({ expense, onPress, onMarkAsPaid }: MonthlyExpenseCardProps) => {
  const isPending = expense.status === 'pendiente';
  const isPaid = expense.status === 'pagado';

  const formatCurrency = (amount: number, currency: string = 'ARS') => {
    const symbol = currency === 'USD' ? 'US$' : currency === 'EUR' ? '€' : '$';
    return `${symbol} ${amount.toLocaleString('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <TouchableOpacity
      style={[styles.card, isPending && styles.cardPending]}
      onPress={() => onPress?.(expense)}
      activeOpacity={0.7}
      disabled={!onPress && !isPending}
    >
      {/* Header: Icon + Concept */}
      <View style={styles.header}>
        <View
          style={[styles.iconContainer, { backgroundColor: expense.category?.color || '#9E9E9E' }]}
        >
          <Text style={styles.categoryIcon}>{expense.category?.icon || '💰'}</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.concept} numberOfLines={1}>
            {expense.concept}
          </Text>
          <Text style={styles.categoryName} numberOfLines={1}>
            {expense.category?.name || 'Sin categoría'}
          </Text>
        </View>

        {/* Status Badge */}
        {isPending && (
          <View style={styles.badgePending}>
            <Text style={styles.badgeTextPending}>Pendiente</Text>
          </View>
        )}
        {isPaid && (
          <View style={styles.badgePaid}>
            <Text style={styles.badgeTextPaid}>Pagado</Text>
          </View>
        )}
      </View>

      {/* Amount Section */}
      {isPending ? (
        <View style={styles.amountSection}>
          <View style={styles.amountRow}>
            <Text style={styles.labelGray}>Estimado:</Text>
            <Text style={styles.amountReference}>
              {formatCurrency(expense.previousAmount || 0, expense.recurringExpense?.currency)}
            </Text>
          </View>
          <Text style={styles.amountZero}>
            {formatCurrency(0, expense.recurringExpense?.currency)}
          </Text>
        </View>
      ) : (
        <View style={styles.amountSection}>
          <Text style={styles.amountPaid}>
            {formatCurrency(expense.amount, expense.recurringExpense?.currency)}
          </Text>
          <View style={styles.paidDetails}>
            {expense.paidDate && (
              <Text style={styles.paidDate}>📅 {formatDate(expense.paidDate)}</Text>
            )}
            {expense.account && <Text style={styles.paidAccount}>💳 {expense.account.name}</Text>}
          </View>
        </View>
      )}

      {/* Action Button for Pending */}
      {isPending && onMarkAsPaid && (
        <TouchableOpacity
          style={styles.payButton}
          onPress={(e) => {
            e.stopPropagation();
            onMarkAsPaid(expense);
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.payButtonText}>Marcar como pagado</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardPending: {
    borderLeftColor: '#FF9800',
    backgroundColor: '#FFFBF5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryIcon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  concept: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 2,
  },
  categoryName: {
    fontSize: 13,
    color: '#666',
  },
  badgePending: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF9800',
  },
  badgeTextPending: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF9800',
    textTransform: 'uppercase',
  },
  badgePaid: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  badgeTextPaid: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4CAF50',
    textTransform: 'uppercase',
  },
  amountSection: {
    marginBottom: 8,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  labelGray: {
    fontSize: 12,
    color: '#999',
  },
  amountReference: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  amountZero: {
    fontSize: 24,
    fontWeight: '700',
    color: '#999',
  },
  amountPaid: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4CAF50',
    marginBottom: 8,
  },
  paidDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  paidDate: {
    fontSize: 13,
    color: '#666',
  },
  paidAccount: {
    fontSize: 13,
    color: '#666',
  },
  payButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  payButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
