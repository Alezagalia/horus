/**
 * HomeScreen - Improved Dashboard
 * Sprint 5 - US-041
 *
 * Dashboard with visual statistics:
 * - Card "Hoy": Circular progress showing today's completion rate
 * - Card "Mejor Racha": Habit with longest active streak
 * - Card "Evolución": Bar chart of last 7 days
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
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useGeneralStats } from '../hooks';
import { StatsCard } from '../components/stats/StatsCard';
import { CircularProgress } from '../components/stats/CircularProgress';
import { WeeklyChart } from '../components/stats/WeeklyChart';

type RootStackParamList = {
  Home: undefined;
  HabitsList: undefined;
  HabitDetail: { habitId: string };
  HabitStats: { habitId: string };
  // Fitness routes - Sprint 14
  Exercises: undefined;
  Routines: undefined;
  WorkoutHistory: undefined;
  Stats: undefined;
  // Resources routes - Fase 3
  Resources: undefined;
  // Add other routes as needed
};

type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  // US-045: Using custom hook with cache strategy
  const { data: stats, isLoading, isError, refetch, isRefetching } = useGeneralStats();

  const handleRefresh = () => {
    refetch();
  };

  const handleTodayCardPress = () => {
    // Navigate to HabitosDiariosScreen (to be implemented)
    // For now, navigate to HabitsList
    navigation.navigate('HabitsList');
  };

  const handleBestStreakPress = () => {
    if (stats?.longestCurrentStreak.habitId) {
      navigation.navigate('HabitStats', { habitId: stats.longestCurrentStreak.habitId });
    }
  };

  if (isLoading && !stats) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Cargando estadísticas...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error al cargar estadísticas</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!stats) {
    return null;
  }

  const { completionRateToday, longestCurrentStreak, last7Days } = stats;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Bienvenido a Horus</Text>
        <Text style={styles.subtitleText}>Tu progreso de hoy</Text>
      </View>

      {/* Card 1: Hoy - Completion Rate */}
      <StatsCard title="Hoy" onPress={handleTodayCardPress}>
        <CircularProgress percentage={completionRateToday.percentage} />
        <Text style={styles.completionText}>
          {completionRateToday.completed} de {completionRateToday.total} hábitos completados
        </Text>
      </StatsCard>

      {/* Card 2: Mejor Racha */}
      <StatsCard
        title="Mejor Racha"
        onPress={longestCurrentStreak.habitId ? handleBestStreakPress : undefined}
      >
        {longestCurrentStreak.streak > 0 ? (
          <View style={styles.streakContainer}>
            <Text style={styles.streakBadge}>🔥 {longestCurrentStreak.streak} días</Text>
            <Text style={styles.habitName}>{longestCurrentStreak.habitName}</Text>
          </View>
        ) : (
          <Text style={styles.noDataText}>Aún no tienes rachas activas</Text>
        )}
      </StatsCard>

      {/* Card 3: Evolución - Last 7 Days */}
      <StatsCard title="Evolución (últimos 7 días)">
        {last7Days.length > 0 ? (
          <WeeklyChart data={last7Days} />
        ) : (
          <Text style={styles.noDataText}>No hay datos suficientes</Text>
        )}
      </StatsCard>

      {/* Quick Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('HabitsList')}
        >
          <Text style={styles.actionButtonText}>🎯 Ver Mis Hábitos</Text>
        </TouchableOpacity>
      </View>

      {/* Fitness Section - Sprint 14 */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>💪 Fitness</Text>
        <View style={styles.fitnessGrid}>
          <TouchableOpacity
            style={styles.fitnessCard}
            onPress={() => navigation.navigate('Exercises')}
          >
            <Text style={styles.fitnessIcon}>💪</Text>
            <Text style={styles.fitnessLabel}>Ejercicios</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.fitnessCard}
            onPress={() => navigation.navigate('Routines')}
          >
            <Text style={styles.fitnessIcon}>📋</Text>
            <Text style={styles.fitnessLabel}>Rutinas</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.fitnessCard}
            onPress={() => navigation.navigate('WorkoutHistory')}
          >
            <Text style={styles.fitnessIcon}>📊</Text>
            <Text style={styles.fitnessLabel}>Historial</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.fitnessCard} onPress={() => navigation.navigate('Stats')}>
            <Text style={styles.fitnessIcon}>📈</Text>
            <Text style={styles.fitnessLabel}>Estadísticas</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Resources Section - Fase 3 */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>📚 Conocimiento</Text>
        <TouchableOpacity
          style={styles.resourcesButton}
          onPress={() => navigation.navigate('Resources')}
        >
          <Text style={styles.resourcesIcon}>📚</Text>
          <View style={styles.resourcesTextContainer}>
            <Text style={styles.resourcesButtonText}>Gestión de Conocimiento</Text>
            <Text style={styles.resourcesButtonSubtext}>Notas, snippets de código y bookmarks</Text>
          </View>
          <Text style={styles.resourcesArrow}>→</Text>
        </TouchableOpacity>
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
    paddingVertical: 20,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 16,
    color: '#666',
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
  completionText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  streakContainer: {
    alignItems: 'center',
  },
  streakBadge: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 8,
  },
  habitName: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  noDataText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
  },
  actionsContainer: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  actionButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  // Fitness section styles - Sprint 14
  sectionContainer: {
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  fitnessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  fitnessCard: {
    backgroundColor: '#fff',
    width: '48%',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  fitnessIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  fitnessLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  // Resources section styles - Fase 3
  resourcesButton: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  resourcesIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  resourcesTextContainer: {
    flex: 1,
  },
  resourcesButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  resourcesButtonSubtext: {
    fontSize: 12,
    color: '#666',
  },
  resourcesArrow: {
    fontSize: 24,
    color: '#2196F3',
    marginLeft: 8,
  },
});
