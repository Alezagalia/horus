/**
 * GoalDetailScreen
 * F-02 - Metas y Objetivos (Goals + OKRs)
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  useRoute,
  useNavigation,
  RouteProp,
  NavigationProp,
  ParamListBase,
} from '@react-navigation/native';
import { getGoal, updateGoal, type Goal, type GoalStatus } from '../api/goals.api';

function getProgressColor(progress: number): string {
  if (progress >= 100) return '#10B981';
  if (progress >= 80) return '#F59E0B';
  return '#3B82F6';
}

const PRIORITY_LABELS: Record<string, string> = {
  alta: 'Alta',
  media: 'Media',
  baja: 'Baja',
};

const STATUS_COLORS: Record<string, string> = {
  pendiente: '#6B7280',
  en_progreso: '#3B82F6',
  completada: '#10B981',
  cancelada: '#9CA3AF',
};

export function GoalDetailScreen() {
  const route = useRoute<RouteProp<{ GoalDetail: { goalId: string } }, 'GoalDetail'>>();
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const queryClient = useQueryClient();
  const { goalId } = route.params as { goalId: string };
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: goal,
    isLoading,
    refetch,
  } = useQuery<Goal>({
    queryKey: ['goals', goalId],
    queryFn: () => getGoal(goalId),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (status: string) => updateGoal(goalId, { status: status as GoalStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['goals', goalId] });
    },
  });

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleToggleStatus = () => {
    if (!goal) return;
    const newStatus = goal.status === 'en_progreso' ? 'completada' : 'en_progreso';
    const label = newStatus === 'completada' ? 'completada' : 'reactivada';
    Alert.alert(`Marcar como ${label}`, `¿Querés marcar esta meta como ${label}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Confirmar', onPress: () => toggleStatusMutation.mutate(newStatus) },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  if (!goal) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Meta no encontrada</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const progress = goal.progress;
  const barColor = getProgressColor(progress);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={['#6366F1']}
          tintColor="#6366F1"
        />
      }
    >
      {/* Header Card */}
      <View style={styles.card}>
        <View style={styles.titleRow}>
          {goal.category?.icon ? (
            <Text style={styles.categoryIcon}>{goal.category.icon}</Text>
          ) : null}
          <Text style={styles.title}>{goal.title}</Text>
        </View>

        {goal.description ? <Text style={styles.description}>{goal.description}</Text> : null}

        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{PRIORITY_LABELS[goal.priority] ?? goal.priority}</Text>
          </View>
          {goal.category?.name ? (
            <View style={[styles.badge, styles.badgeBlue]}>
              <Text style={[styles.badgeText, styles.badgeTextBlue]}>{goal.category.name}</Text>
            </View>
          ) : null}
          {goal.status === 'completada' ? (
            <View style={[styles.badge, styles.badgeGreen]}>
              <Text style={[styles.badgeText, styles.badgeTextGreen]}>✓ Completada</Text>
            </View>
          ) : null}
        </View>

        {goal.targetDate ? (
          <Text style={styles.dateText}>
            📅 Fecha límite: {new Date(goal.targetDate).toLocaleDateString('es-AR')}
          </Text>
        ) : null}

        {/* Progress */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Progreso</Text>
            <Text style={[styles.progressValue, { color: barColor }]}>{progress}%</Text>
          </View>
          <View style={styles.barTrack}>
            <View
              style={[
                styles.barFill,
                { width: `${Math.min(progress, 100)}%` as `${number}%`, backgroundColor: barColor },
              ]}
            />
          </View>
        </View>

        {/* Toggle status */}
        <TouchableOpacity
          style={[
            styles.actionBtn,
            goal.status === 'en_progreso' ? styles.actionBtnGreen : styles.actionBtnBlue,
          ]}
          onPress={handleToggleStatus}
          disabled={toggleStatusMutation.isPending}
        >
          <Text style={styles.actionBtnText}>
            {goal.status === 'en_progreso' ? '✓ Marcar completada' : '↺ Reactivar'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Key Results */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎯 Key Results</Text>
        {(goal.keyResults ?? []).length === 0 ? (
          <Text style={styles.emptyText}>Sin Key Results configurados.</Text>
        ) : (
          (goal.keyResults ?? []).map((kr) => {
            const pct =
              kr.targetValue > 0
                ? Math.min(Math.round((kr.currentValue / kr.targetValue) * 100), 100)
                : 0;
            const krColor = getProgressColor(pct);
            return (
              <View key={kr.id} style={styles.krItem}>
                <View style={styles.krHeader}>
                  <Text style={styles.krTitle}>{kr.title}</Text>
                  <Text style={[styles.krPct, { color: krColor }]}>{pct}%</Text>
                </View>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      { width: `${pct}%` as `${number}%`, backgroundColor: krColor },
                    ]}
                  />
                </View>
                <Text style={styles.krValues}>
                  {kr.currentValue} / {kr.targetValue}
                  {kr.unit ? ` ${kr.unit}` : ''}
                </Text>
              </View>
            );
          })
        )}
      </View>

      {/* Linked Habits */}
      {(goal.goalHabits ?? []).length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔄 Hábitos vinculados</Text>
          {(goal.goalHabits ?? []).map((gh) => (
            <View key={gh.habitId} style={styles.linkedItem}>
              <Text style={styles.linkedItemText}>
                {gh.habit.icon ? `${gh.habit.icon} ` : ''}
                {gh.habit.name}
              </Text>
              {gh.habit.lastCompletedDate && (
                <Text style={styles.linkedItemMeta}>
                  {new Date(gh.habit.lastCompletedDate).toLocaleDateString('es-AR')}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Linked Tasks */}
      {(goal.goalTasks ?? []).length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✅ Tareas vinculadas</Text>
          {(goal.goalTasks ?? []).map((gt) => (
            <View key={gt.taskId} style={styles.linkedItem}>
              <Text style={styles.linkedItemText}>{gt.task.title}</Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: STATUS_COLORS[gt.task.status] ?? '#6B7280' },
                ]}
              >
                <Text style={styles.statusBadgeText}>{gt.task.status}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 16, paddingBottom: 40, gap: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  errorText: { fontSize: 16, color: '#6B7280' },
  backBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#6366F1',
    borderRadius: 8,
  },
  backBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
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
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  categoryIcon: { fontSize: 22, marginTop: 1 },
  title: { fontSize: 18, fontWeight: '700', color: '#111827', flex: 1 },
  description: { fontSize: 14, color: '#6B7280', marginBottom: 10, lineHeight: 20 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
  },
  badgeBlue: { backgroundColor: '#EEF2FF' },
  badgeGreen: { backgroundColor: '#D1FAE5' },
  badgeText: { fontSize: 11, fontWeight: '600', color: '#374151' },
  badgeTextBlue: { color: '#4338CA' },
  badgeTextGreen: { color: '#065F46' },
  dateText: { fontSize: 12, color: '#9CA3AF', marginBottom: 12 },
  progressSection: { marginBottom: 14 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 13, fontWeight: '500', color: '#374151' },
  progressValue: { fontSize: 20, fontWeight: '800' },
  barTrack: { height: 8, backgroundColor: '#F3F4F6', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  actionBtn: { paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  actionBtnGreen: { backgroundColor: '#10B981' },
  actionBtnBlue: { backgroundColor: '#3B82F6' },
  actionBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  section: {
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
    gap: 10,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  emptyText: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', paddingVertical: 8 },
  krItem: { gap: 4 },
  krHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  krTitle: { fontSize: 13, fontWeight: '500', color: '#374151', flex: 1 },
  krPct: { fontSize: 13, fontWeight: '700' },
  krValues: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  linkedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderTopWidth: 0.5,
    borderTopColor: '#F3F4F6',
  },
  linkedItemText: { fontSize: 13, color: '#374151', flex: 1 },
  linkedItemMeta: { fontSize: 11, color: '#9CA3AF' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  statusBadgeText: { fontSize: 10, color: '#fff', fontWeight: '600' },
});
