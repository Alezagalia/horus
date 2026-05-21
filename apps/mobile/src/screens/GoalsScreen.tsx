/**
 * GoalsScreen
 * F-02 - Metas y Objetivos (Goals + OKRs)
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation, NavigationProp, ParamListBase } from '@react-navigation/native';
import { getGoals, type Goal, type GoalStatus } from '../api/goals.api';

type StatusFilter = GoalStatus | 'all';

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'en_progreso', label: 'En progreso' },
  { key: 'completada', label: 'Completadas' },
  { key: 'all', label: 'Todas' },
];

const PRIORITY_COLORS: Record<string, string> = {
  alta: '#EF4444',
  media: '#F59E0B',
  baja: '#10B981',
};

function getProgressColor(progress: number): string {
  if (progress >= 100) return '#10B981';
  if (progress >= 80) return '#F59E0B';
  return '#3B82F6';
}

function getDaysRemaining(targetDate?: string | null): string | null {
  if (!targetDate) return null;
  const days = Math.ceil((new Date(targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days < 0) return 'Vencida';
  if (days === 0) return 'Vence hoy';
  return `${days}d`;
}

function GoalCard({ goal, onPress }: { goal: Goal; onPress: () => void }) {
  const progress = goal.progress;
  const barColor = getProgressColor(progress);
  const priorityColor = PRIORITY_COLORS[goal.priority] ?? '#6B7280';
  const daysLabel = getDaysRemaining(goal.targetDate);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          {goal.category?.icon ? (
            <Text style={styles.categoryIcon}>{goal.category.icon}</Text>
          ) : null}
          <Text style={styles.cardTitle} numberOfLines={2}>
            {goal.title}
          </Text>
        </View>
        <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
      </View>

      {/* Category + days */}
      <View style={styles.metaRow}>
        {goal.category?.name ? (
          <Text style={styles.categoryLabel}>{goal.category.name}</Text>
        ) : null}
        {daysLabel && goal.status === 'en_progreso' ? (
          <Text style={[styles.daysLabel, daysLabel === 'Vencida' && styles.overdue]}>
            📅 {daysLabel}
          </Text>
        ) : null}
        {goal.status === 'completada' ? (
          <Text style={styles.completedBadge}>✓ Completada</Text>
        ) : null}
      </View>

      {/* Progress bar */}
      <View style={styles.progressRow}>
        <View style={styles.barTrack}>
          <View
            style={[
              styles.barFill,
              { width: `${Math.min(progress, 100)}%` as `${number}%`, backgroundColor: barColor },
            ]}
          />
        </View>
        <Text style={[styles.progressText, { color: barColor }]}>{progress}%</Text>
      </View>

      {/* Counters */}
      <View style={styles.countersRow}>
        {(goal.keyResults?.length ?? 0) > 0 && (
          <Text style={styles.counterText}>🎯 {goal.keyResults?.length} KRs</Text>
        )}
        {goal.linkedHabitsCount > 0 && (
          <Text style={styles.counterText}>🔄 {goal.linkedHabitsCount}</Text>
        )}
        {goal.linkedTasksCount > 0 && (
          <Text style={styles.counterText}>✅ {goal.linkedTasksCount}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

export function GoalsScreen() {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('en_progreso');
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: goals = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['goals', activeFilter],
    queryFn: () => getGoals(activeFilter === 'all' ? undefined : activeFilter),
  });

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🏆 Metas</Text>
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            onPress={() => setActiveFilter(f.key)}
            style={[styles.filterBtn, activeFilter === f.key && styles.filterBtnActive]}
          >
            <Text style={[styles.filterText, activeFilter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      ) : (
        <FlatList
          data={goals}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#6366F1']}
              tintColor="#6366F1"
            />
          }
          renderItem={({ item }) => (
            <GoalCard
              goal={item}
              onPress={() => navigation.navigate('GoalDetail', { goalId: item.id })}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🏆</Text>
              <Text style={styles.emptyTitle}>Sin metas</Text>
              <Text style={styles.emptyDesc}>
                Creá metas desde la web para hacer seguimiento de tus objetivos.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: { fontSize: 26, fontWeight: '700', color: '#111827' },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  filterBtnActive: {
    backgroundColor: '#6366F1',
  },
  filterText: { fontSize: 13, fontWeight: '500', color: '#6B7280' },
  filterTextActive: { color: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },
  card: {
    backgroundColor: '#fff',
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
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  categoryIcon: { fontSize: 18 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#111827', flex: 1 },
  priorityDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4, marginLeft: 8 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  categoryLabel: { fontSize: 11, color: '#6B7280' },
  daysLabel: { fontSize: 11, color: '#6B7280' },
  overdue: { color: '#EF4444' },
  completedBadge: { fontSize: 11, color: '#10B981', fontWeight: '600' },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  barTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 4 },
  progressText: { fontSize: 12, fontWeight: '700', minWidth: 36, textAlign: 'right' },
  countersRow: { flexDirection: 'row', gap: 12 },
  counterText: { fontSize: 11, color: '#9CA3AF' },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    paddingTop: 80,
  },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20 },
});
