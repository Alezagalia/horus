/**
 * MonthStatsCard Component
 * Sprint 9 - US-078
 *
 * Card component to display month statistics (ingresos, egresos, balance)
 */

import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency } from '../../utils/currency';

interface MonthStatsCardProps {
  totalIngresos: number;
  totalEgresos: number;
  balance: number;
  currency?: string;
}

export function MonthStatsCard({
  totalIngresos,
  totalEgresos,
  balance,
  currency = 'ARS',
}: MonthStatsCardProps) {
  const balanceColor = balance >= 0 ? '#10B981' : '#EF4444';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Estadísticas del Mes</Text>

      <View style={styles.statsGrid}>
        {/* Ingresos */}
        <View style={[styles.statCard, styles.ingresosCard]}>
          <View style={styles.statIcon}>
            <Ionicons name="arrow-up-circle" size={24} color="#10B981" />
          </View>
          <Text style={styles.statLabel}>Ingresos</Text>
          <Text style={[styles.statAmount, { color: '#10B981' }]}>
            {formatCurrency(totalIngresos, currency, { decimals: 0 })}
          </Text>
        </View>

        {/* Egresos */}
        <View style={[styles.statCard, styles.egresosCard]}>
          <View style={styles.statIcon}>
            <Ionicons name="arrow-down-circle" size={24} color="#EF4444" />
          </View>
          <Text style={styles.statLabel}>Egresos</Text>
          <Text style={[styles.statAmount, { color: '#EF4444' }]}>
            {formatCurrency(totalEgresos, currency, { decimals: 0 })}
          </Text>
        </View>

        {/* Balance */}
        <View style={[styles.statCard, styles.balanceCard]}>
          <View style={styles.statIcon}>
            <Ionicons
              name={balance >= 0 ? 'trending-up' : 'trending-down'}
              size={24}
              color={balanceColor}
            />
          </View>
          <Text style={styles.statLabel}>Balance</Text>
          <Text style={[styles.statAmount, { color: balanceColor }]}>
            {formatCurrency(balance, currency, { decimals: 0 })}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  ingresosCard: {
    backgroundColor: '#D1FAE5',
  },
  egresosCard: {
    backgroundColor: '#FEE2E2',
  },
  balanceCard: {
    backgroundColor: '#F3F4F6',
  },
  statIcon: {
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  statAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
});
