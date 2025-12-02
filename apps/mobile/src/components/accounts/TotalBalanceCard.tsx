/**
 * TotalBalanceCard Component
 * Sprint 9 - US-078
 *
 * Card component to display total balance grouped by currency
 */

import { View, Text, StyleSheet } from 'react-native';
import { formatCurrency, getCurrencyColor } from '../../utils/currency';

interface CurrencyTotal {
  currency: string;
  total: number;
  accountCount: number;
}

interface TotalBalanceCardProps {
  totalsByCurrency: CurrencyTotal[];
}

export function TotalBalanceCard({ totalsByCurrency }: TotalBalanceCardProps) {
  if (totalsByCurrency.length === 0) {
    return null;
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Saldo Total</Text>

      <View style={styles.currenciesContainer}>
        {totalsByCurrency.map((item) => (
          <View key={item.currency} style={styles.currencyItem}>
            <View
              style={[styles.currencyDot, { backgroundColor: getCurrencyColor(item.currency) }]}
            />
            <View style={styles.currencyInfo}>
              <Text style={styles.currencyCode}>{item.currency}</Text>
              <Text style={styles.amount}>{formatCurrency(item.total, item.currency)}</Text>
              <Text style={styles.accountCount}>
                {item.accountCount} {item.accountCount === 1 ? 'cuenta' : 'cuentas'}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  currenciesContainer: {
    gap: 12,
  },
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencyDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  currencyInfo: {
    flex: 1,
  },
  currencyCode: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 2,
  },
  amount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  accountCount: {
    fontSize: 11,
    color: '#9CA3AF',
  },
});
