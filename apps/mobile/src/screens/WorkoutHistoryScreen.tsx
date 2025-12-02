/**
 * WorkoutHistoryScreen
 * Sprint 14 - US-135
 *
 * Pantalla de historial de entrenamientos completados con filtros
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { listWorkouts, ListWorkoutsFilters } from '../api/workouts.api';
import { WorkoutCard } from '../components/workouts/WorkoutCard';
import type { WorkoutListItem } from '@horus/shared';

type RootStackParamList = {
  WorkoutHistory: undefined;
  WorkoutDetail: { workoutId: string };
};

type WorkoutHistoryScreenNavigationProp = StackNavigationProp<RootStackParamList>;

type PeriodFilter = 7 | 30 | 90 | null;

export const WorkoutHistoryScreen: React.FC = () => {
  const navigation = useNavigation<WorkoutHistoryScreenNavigationProp>();

  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>(30);

  // Fetch workouts
  const {
    data: response,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['workouts', selectedPeriod],
    queryFn: () => {
      const filters: ListWorkoutsFilters = {};
      if (selectedPeriod) {
        filters.days = selectedPeriod;
      }
      return listWorkouts(filters);
    },
  });

  const workouts = response?.workouts || [];

  const handleWorkoutPress = (workout: WorkoutListItem) => {
    navigation.navigate('WorkoutDetail', { workoutId: workout.id });
  };

  const renderPeriodFilters = () => {
    const filters: Array<{ label: string; value: PeriodFilter }> = [
      { label: '7 días', value: 7 },
      { label: '30 días', value: 30 },
      { label: '90 días', value: 90 },
      { label: 'Todo', value: null },
    ];

    return (
      <View style={styles.filtersContainer}>
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.label}
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

  const renderEmpty = () => {
    if (isLoading) return null;

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🏋️</Text>
        <Text style={styles.emptyTitle}>Sin entrenamientos</Text>
        <Text style={styles.emptyText}>
          {selectedPeriod
            ? `No hay entrenamientos en los últimos ${selectedPeriod} días`
            : 'Aún no has completado ningún entrenamiento'}
        </Text>
        <Text style={styles.emptyHint}>¡Comienza una rutina para registrar tu primer workout!</Text>
      </View>
    );
  };

  const renderError = () => {
    if (!isError) return null;

    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Error al cargar</Text>
        <Text style={styles.errorText}>No se pudo cargar el historial de entrenamientos</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Historial</Text>
        {workouts.length > 0 && (
          <Text style={styles.headerSubtitle}>
            {workouts.length} {workouts.length === 1 ? 'entrenamiento' : 'entrenamientos'}
          </Text>
        )}
      </View>

      {/* Period Filters */}
      {renderPeriodFilters()}

      {/* Loading State */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Cargando historial...</Text>
        </View>
      )}

      {/* Error State */}
      {renderError()}

      {/* Workouts List */}
      {!isLoading && !isError && (
        <FlatList
          data={workouts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <WorkoutCard workout={item} onPress={() => handleWorkoutPress(item)} />
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={['#007AFF']} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
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
    fontSize: 14,
    color: '#666',
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
  listContent: {
    padding: 16,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
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
});
