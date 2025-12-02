/**
 * StatsScreen (MVP)
 * Sprint 14 - US-136
 *
 * Pantalla de estadísticas generales de entrenamientos
 * MVP: Focus en métricas clave sin gráficos complejos
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getOverviewStats } from '../api/workoutStats.api';

type PeriodFilter = 7 | 30 | 90;

export const StatsScreen: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>(30);

  // Fetch overview stats
  const {
    data: stats,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['stats', 'overview', selectedPeriod],
    queryFn: () => getOverviewStats(selectedPeriod),
  });

  const formatVolume = (volume: number): string => {
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}k kg`;
    }
    return `${Math.round(volume)} kg`;
  };

  const formatDuration = (minutes: number): string => {
    const hrs = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const renderPeriodFilters = () => {
    const filters: Array<{ label: string; value: PeriodFilter }> = [
      { label: '7 días', value: 7 },
      { label: '30 días', value: 30 },
      { label: '90 días', value: 90 },
    ];

    return (
      <View style={styles.filtersContainer}>
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.value}
            style={[
              styles.filterButton,
              selectedPeriod === filter.value && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedPeriod(filter.value)}
          >
            <Text
              style={[
                styles.filterButtonText,
                selectedPeriod === filter.value && styles.filterButtonTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderMetricCard = (
    title: string,
    value: string | number,
    subtitle?: string,
    icon?: string
  ) => {
    return (
      <View style={styles.metricCard}>
        {icon && <Text style={styles.metricIcon}>{icon}</Text>}
        <Text style={styles.metricTitle}>{title}</Text>
        <Text style={styles.metricValue}>{value}</Text>
        {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Estadísticas</Text>
        </View>
        {renderPeriodFilters()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Cargando estadísticas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !stats) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Estadísticas</Text>
        </View>
        {renderPeriodFilters()}
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Error al cargar</Text>
          <Text style={styles.errorText}>No se pudieron cargar las estadísticas</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Check if there's no data
  const hasNoData = stats.workouts.completed === 0;

  if (hasNoData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Estadísticas</Text>
        </View>
        {renderPeriodFilters()}
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyTitle}>Sin datos</Text>
          <Text style={styles.emptyText}>
            No hay entrenamientos completados en los últimos {selectedPeriod} días
          </Text>
          <Text style={styles.emptyHint}>¡Completa tu primer workout para ver estadísticas!</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Estadísticas</Text>
          <Text style={styles.headerSubtitle}>
            Últimos {selectedPeriod} días ({stats.period.from} - {stats.period.to})
          </Text>
        </View>

        {/* Period Filters */}
        {renderPeriodFilters()}

        {/* Main Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumen General</Text>
          <View style={styles.metricsGrid}>
            {renderMetricCard(
              'Entrenamientos',
              stats.workouts.completed,
              `${stats.workouts.frequency.toFixed(1)}/semana`,
              '🏋️'
            )}
            {renderMetricCard(
              'Volumen Total',
              formatVolume(stats.volume.total),
              `${formatVolume(stats.volume.avgPerWorkout)}/sesión`,
              '💪'
            )}
            {renderMetricCard(
              'Duración Promedio',
              formatDuration(stats.workouts.avgDuration),
              `Total: ${formatDuration(stats.workouts.avgDuration * stats.workouts.completed)}`,
              '⏱️'
            )}
            {renderMetricCard(
              'Ejercicios Únicos',
              stats.exercises.uniqueExercises,
              `${stats.exercises.totalSets} series totales`,
              '✅'
            )}
          </View>
        </View>

        {/* Top Exercises */}
        {stats.topExercises.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Ejercicios</Text>
            <View style={styles.topExercises}>
              {stats.topExercises.slice(0, 5).map((exercise, index) => (
                <View key={exercise.exerciseId} style={styles.topExerciseItem}>
                  <View style={styles.topExerciseLeft}>
                    <Text style={styles.topExerciseRank}>#{index + 1}</Text>
                    <View style={styles.topExerciseInfo}>
                      <Text style={styles.topExerciseName}>{exercise.exerciseName}</Text>
                      <Text style={styles.topExerciseSubtext}>
                        {exercise.count} {exercise.count === 1 ? 'vez' : 'veces'} •{' '}
                        {formatVolume(exercise.totalVolume)}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Muscle Group Distribution */}
        {stats.muscleGroupDistribution.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Distribución Muscular</Text>
            <View style={styles.muscleDistribution}>
              {stats.muscleGroupDistribution.map((group) => (
                <View key={group.muscleGroup} style={styles.muscleGroupItem}>
                  <View style={styles.muscleGroupHeader}>
                    <Text style={styles.muscleGroupName}>{group.muscleGroup}</Text>
                    <Text style={styles.muscleGroupPercentage}>{group.percentage.toFixed(0)}%</Text>
                  </View>
                  <View style={styles.muscleGroupBar}>
                    <View style={[styles.muscleGroupBarFill, { width: `${group.percentage}%` }]} />
                  </View>
                  <Text style={styles.muscleGroupCount}>
                    {group.count} {group.count === 1 ? 'ejercicio' : 'ejercicios'}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Weekly Frequency */}
        {stats.weeklyFrequency.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Frecuencia Semanal</Text>
            <View style={styles.weeklyFrequency}>
              {stats.weeklyFrequency.map((week) => (
                <View key={week.week} style={styles.weekItem}>
                  <Text style={styles.weekLabel}>{week.week}</Text>
                  <View style={styles.weekBarContainer}>
                    <View
                      style={[
                        styles.weekBar,
                        {
                          height: Math.max(
                            20,
                            (week.workouts /
                              Math.max(...stats.weeklyFrequency.map((w) => w.workouts))) *
                              100
                          ),
                        },
                      ]}
                    />
                    <Text style={styles.weekValue}>{week.workouts}</Text>
                  </View>
                  <Text style={styles.weekVolume}>{formatVolume(week.totalVolume)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#999',
  },
  filtersContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  metricIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  metricTitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  metricSubtitle: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
  },
  topExercises: {
    gap: 12,
  },
  topExerciseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  topExerciseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  topExerciseRank: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    width: 40,
  },
  topExerciseInfo: {
    flex: 1,
  },
  topExerciseName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  topExerciseSubtext: {
    fontSize: 12,
    color: '#666',
  },
  muscleDistribution: {
    gap: 16,
  },
  muscleGroupItem: {
    gap: 6,
  },
  muscleGroupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  muscleGroupName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  muscleGroupPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  muscleGroupBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  muscleGroupBarFill: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  muscleGroupCount: {
    fontSize: 11,
    color: '#999',
  },
  weeklyFrequency: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 150,
  },
  weekItem: {
    alignItems: 'center',
    gap: 4,
  },
  weekLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 4,
  },
  weekBarContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 100,
  },
  weekBar: {
    width: 30,
    backgroundColor: '#007AFF',
    borderRadius: 4,
    minHeight: 20,
  },
  weekValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  weekVolume: {
    fontSize: 10,
    color: '#999',
  },
  bottomPadding: {
    height: 32,
  },
});
