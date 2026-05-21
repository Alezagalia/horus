/**
 * BudgetsScreen
 * F-01 - Presupuestos Mensuales por Categoría
 *
 * Displays monthly budget templates with real spending progress bars.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { getBudgetsSummary, deleteBudget, type BudgetSummary } from '../api/budgets.api';

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function getBarColor(percentage: number): string {
  if (percentage >= 100) return '#EF4444';
  if (percentage >= 80) return '#F59E0B';
  return '#10B981';
}

function formatAmount(amount: number, currency: string): string {
  return `${currency} ${amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function BudgetCard({
  item,
  onDelete,
}: {
  item: BudgetSummary;
  onDelete: (item: BudgetSummary) => void;
}) {
  const clampedPct = Math.min(item.percentage, 100);
  const isOver = item.percentage >= 100;
  const barColor = getBarColor(item.percentage);

  return (
    <View style={styles.card}>
      {/* Header row */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          {item.category?.icon ? (
            <Text style={styles.categoryIcon}>{item.category.icon}</Text>
          ) : null}
          <View>
            <Text style={styles.categoryName}>{item.category?.name ?? '—'}</Text>
            <Text style={styles.currencyLabel}>{item.currency}</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => onDelete(item)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="trash-outline" size={18} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {/* Percentage + budget amount */}
      <View style={styles.pctRow}>
        <Text style={[styles.pctText, { color: barColor }]}>{item.percentage}%</Text>
        <Text style={styles.budgetAmount}>{formatAmount(item.amount, item.currency)}</Text>
      </View>

      {/* Progress bar */}
      <View style={styles.barTrack}>
        <View
          style={[
            styles.barFill,
            { width: `${clampedPct}%` as `${number}%`, backgroundColor: barColor },
          ]}
        />
      </View>

      {/* Spent info */}
      {isOver ? (
        <Text style={styles.overText}>
          ⚠ Excedido por {formatAmount(Math.abs(item.remaining), item.currency)}
        </Text>
      ) : (
        <Text style={styles.spentText}>
          Gastado: {formatAmount(item.spent, item.currency)} · Quedan:{' '}
          {formatAmount(item.remaining, item.currency)}
        </Text>
      )}
    </View>
  );
}

export function BudgetsScreen() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [refreshing, setRefreshing] = useState(false);

  const queryClient = useQueryClient();

  const {
    data: summary = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['budgets', 'summary', selectedMonth, selectedYear],
    queryFn: () => getBudgetsSummary(selectedMonth, selectedYear),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBudget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleDelete = useCallback(
    (item: BudgetSummary) => {
      Alert.alert(
        'Eliminar presupuesto',
        `¿Eliminar el presupuesto de ${item.category?.name ?? 'esta categoría'} (${item.currency})?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: () => deleteMutation.mutate(item.id),
          },
        ]
      );
    },
    [deleteMutation]
  );

  const prevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  // Badge: how many budgets are over 80%
  const alertCount = summary.filter((b) => b.percentage >= 80).length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🎯 Presupuestos</Text>
        {alertCount > 0 && (
          <View style={styles.alertBadge}>
            <Text style={styles.alertBadgeText}>{alertCount} ⚠</Text>
          </View>
        )}
      </View>

      {/* Month selector */}
      <View style={styles.monthSelector}>
        <TouchableOpacity onPress={prevMonth} style={styles.monthBtn}>
          <Ionicons name="chevron-back" size={20} color="#6B7280" />
        </TouchableOpacity>
        <Text style={styles.monthLabel}>
          {MONTHS[selectedMonth - 1]} {selectedYear}
        </Text>
        <TouchableOpacity onPress={nextMonth} style={styles.monthBtn}>
          <Ionicons name="chevron-forward" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {isLoading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      ) : summary.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🎯</Text>
          <Text style={styles.emptyTitle}>Sin presupuestos</Text>
          <Text style={styles.emptyDesc}>
            Creá presupuestos desde la web para controlar tus gastos por categoría.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#6366F1']}
              tintColor="#6366F1"
            />
          }
        >
          {summary.map((item) => (
            <BudgetCard key={item.id} item={item} onDelete={handleDelete} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  alertBadge: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  alertBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
  },
  monthBtn: {
    padding: 4,
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    minWidth: 120,
    textAlign: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#0b121e',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 0.5,
    borderColor: '#E5E7EB',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  categoryIcon: {
    fontSize: 24,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  currencyLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 1,
  },
  pctRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  pctText: {
    fontSize: 13,
    fontWeight: '700',
  },
  budgetAmount: {
    fontSize: 12,
    color: '#6B7280',
  },
  barTrack: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  spentText: {
    fontSize: 12,
    color: '#6B7280',
  },
  overText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});
