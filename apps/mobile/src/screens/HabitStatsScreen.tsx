/**
 * HabitStatsScreen - Individual Habit Statistics
 * Sprint 5 - US-042
 *
 * Detailed statistics screen for a specific habit showing:
 * - Streaks (current and longest)
 * - Completion rates (overall and last 30 days)
 * - Calendar heatmap for CHECK habits
 * - Values chart for NUMERIC habits
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { getHabitById, type Habit } from '../api/habits.api';
import { useHabitStats } from '../hooks';
import { StreakCards } from '../components/stats/StreakCards';
import { CompletionRateCards } from '../components/stats/CompletionRateCards';
import { CalendarHeatmap } from '../components/stats/CalendarHeatmap';
import { NumericValuesChart } from '../components/stats/NumericValuesChart';

type RootStackParamList = {
  HabitStats: { habitId: string };
};

type HabitStatsScreenProps = NativeStackScreenProps<RootStackParamList, 'HabitStats'>;

export const HabitStatsScreen: React.FC<HabitStatsScreenProps> = ({ route }) => {
  const { habitId } = route.params;

  // Fetch habit details
  const {
    data: habit,
    isLoading: habitLoading,
    isError: habitError,
  } = useQuery<Habit>({
    queryKey: ['habit', habitId],
    queryFn: () => getHabitById(habitId),
  });

  // Fetch habit stats - US-045: Using custom hook with cache strategy
  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
    refetch,
    isRefetching,
  } = useHabitStats({ habitId });

  const isLoading = habitLoading || statsLoading;
  const isError = habitError || statsError;

  const handleRefresh = () => {
    refetch();
  };

  if (isLoading && !stats) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Cargando estadísticas...</Text>
      </View>
    );
  }

  if (isError || !habit || !stats) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error al cargar estadísticas</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} />}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: habit.color || '#2196F3' }]}>
        <View style={styles.headerContent}>
          <Text style={styles.habitName}>{habit.name}</Text>
          <Text style={styles.habitType}>
            {habit.type === 'CHECK' ? '✓ Hábito de Check' : '📊 Hábito Numérico'}
          </Text>
          {habit.category && (
            <Text style={styles.categoryName}>
              {habit.category.icon} {habit.category.name}
            </Text>
          )}
        </View>
      </View>

      {/* Streak Cards */}
      <View style={styles.section}>
        <StreakCards currentStreak={stats.currentStreak} longestStreak={stats.longestStreak} />
      </View>

      {/* Completion Rate Cards */}
      <View style={styles.section}>
        <CompletionRateCards
          overallRate={stats.overallCompletionRate}
          last30DaysRate={stats.last30DaysRate}
        />
      </View>

      {/* Calendar Heatmap for CHECK habits */}
      {habit.type === 'CHECK' && (
        <View style={styles.section}>
          <View style={styles.cardContainer}>
            <CalendarHeatmap data={stats.last30DaysData} />
          </View>
        </View>
      )}

      {/* Numeric Values Chart for NUMERIC habits */}
      {habit.type === 'NUMERIC' && stats.last30DaysValues && (
        <View style={styles.section}>
          <View style={styles.cardContainer}>
            <NumericValuesChart
              data={stats.last30DaysValues}
              targetValue={habit.targetValue || undefined}
              unit={habit.unit}
              averageValue={stats.averageValue}
              minValue={stats.minValue}
              maxValue={stats.maxValue}
            />
          </View>
        </View>
      )}

      {/* Total Completions */}
      <View style={styles.section}>
        <View style={styles.cardContainer}>
          <View style={styles.totalCompletionsCard}>
            <Text style={styles.totalCompletionsValue}>{stats.totalCompletions}</Text>
            <Text style={styles.totalCompletionsLabel}>Total de Completaciones</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  contentContainer: {
    paddingBottom: 32,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  headerContent: {
    gap: 4,
  },
  habitName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  habitType: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  categoryName: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
    marginTop: 4,
  },
  section: {
    marginBottom: 8,
  },
  cardContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  totalCompletionsCard: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  totalCompletionsValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 8,
  },
  totalCompletionsLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
