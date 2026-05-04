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
import { useQuery } from '@tanstack/react-query';
import { getAccounts } from '../api/accounts.api';
import { getCurrentMonthlyExpenses } from '../api/monthlyExpenses.api';
import { getTasks } from '../api/tasks.api';
import { useAuth } from '../contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { es } from 'date-fns/locale';

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
  // Finance routes - Sprint 2
  FinanceTab: undefined;
  // Add other routes as needed
};

type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  // US-045: Using custom hook with cache strategy (disable refetch on focus to prevent loop)
  const {
    data: stats,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useGeneralStats({
    refetchOnFocus: false,
  });
  const [showTimeout, setShowTimeout] = React.useState(false);

  // Sprint 3: Get user data for hero section
  const { user } = useAuth();

  // Sprint 2: Fetch finance data for dashboard widget
  const { data: accountsData } = useQuery({
    queryKey: ['accounts'],
    queryFn: getAccounts,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: monthlyExpensesData } = useQuery({
    queryKey: ['monthlyExpenses', 'current'],
    queryFn: () => getCurrentMonthlyExpenses({ status: 'pendiente' }),
    staleTime: 5 * 60 * 1000,
  });

  const totalsByCurrency = accountsData?.totalsByCurrency || [];
  const pendingExpenses = monthlyExpensesData?.monthlyExpenses || [];

  // Sprint 5: Fetch urgent/upcoming tasks — no status filter to include en_progreso
  const { data: tasksData } = useQuery({
    queryKey: ['tasks', 'upcoming'],
    queryFn: () => getTasks(),
    staleTime: 30 * 1000, // 30s: reflects newly created tasks quickly
    refetchOnMount: true,
  });

  // Filter: active (pendiente/en_progreso) and urgent or with a due date
  const upcomingTasks = React.useMemo(() => {
    if (!tasksData) return [];
    const now = new Date();
    return tasksData
      .filter((task) => {
        if (task.status === 'completada' || task.status === 'cancelada') return false;
        const isOverdue = task.dueDate != null && new Date(task.dueDate) < now;
        const isHighPriority = task.priority === 'alta';
        const hasDueDate = task.dueDate != null;
        return isOverdue || isHighPriority || hasDueDate;
      })
      .sort((a, b) => {
        const aTime = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const bTime = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        return aTime - bTime;
      })
      .slice(0, 5);
  }, [tasksData]);

  // Sprint 3: Helper function for greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  // Sprint 3: Calculate stats for hero
  const completedCount = stats?.completedHabitsToday || 0;
  const totalCount = stats?.totalHabitsToday || 0;
  const bestStreak = stats?.longestCurrentStreak || 0;
  const overdueTasks = React.useMemo(() => {
    if (!tasksData) return 0;
    const now = new Date();
    return tasksData.filter(
      (task) =>
        (task.status === 'pendiente' || task.status === 'en_progreso') &&
        (task.priority === 'alta' || (task.dueDate != null && new Date(task.dueDate) < now))
    ).length;
  }, [tasksData]);

  // Manual timeout after 15 seconds
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading && !stats) {
        setShowTimeout(true);
      }
    }, 15000);

    return () => clearTimeout(timer);
  }, [isLoading, stats]);

  const handleRefresh = () => {
    setShowTimeout(false);
    refetch();
  };

  const handleTodayCardPress = () => {
    navigation.navigate('HabitsTab', { screen: 'HabitosHoy' });
  };

  const handleBestStreakPress = () => {
    if (stats?.habitWithLongestStreak?.id) {
      navigation.navigate('HabitsTab', {
        screen: 'HabitStats',
        params: { habitId: stats.habitWithLongestStreak.id },
      });
    }
  };

  // Show timeout error after 15 seconds
  if (showTimeout || isError) {
    const errorMessage = showTimeout
      ? 'La carga está tomando mucho tiempo. Verifica tu conexión a internet o intenta más tarde.'
      : error instanceof Error
        ? error.message
        : 'Error al cargar estadísticas';

    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{errorMessage}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: '#666', marginTop: 12 }]}
          onPress={() => navigation.navigate('HabitsTab', { screen: 'HabitsList' })}
        >
          <Text style={styles.retryButtonText}>Continuar sin estadísticas</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading && !stats) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Cargando estadísticas...</Text>
        <Text style={styles.loadingSubtext}>Esperando respuesta del servidor...</Text>
      </View>
    );
  }

  // Show default values if stats failed to load
  const completionRateToday = {
    completed: stats?.completedHabitsToday || 0,
    total: stats?.totalHabitsToday || 0,
    percentage: stats?.completionRateToday || 0,
  };
  const longestCurrentStreak = {
    habitId: stats?.habitWithLongestStreak?.id || null,
    habitName: stats?.habitWithLongestStreak?.name || null,
    streak: stats?.longestCurrentStreak || 0,
  };
  const last7Days = stats?.last7Days || [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} />}
    >
      {/* Hero Section - Sprint 3 */}
      <LinearGradient
        colors={['#6366F1', '#8B5CF6', '#EC4899']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroSection}
      >
        <View style={styles.heroContent}>
          <Text style={styles.greetingText}>{getGreeting()}</Text>
          <Text style={styles.heroTitle}>{user?.name?.split(' ')[0] || 'Usuario'}</Text>
          <Text style={styles.heroSubtitle}>
            Aquí tienes un resumen de tu día. Mantén el enfoque y alcanza tus metas.
          </Text>

          {/* Quick Stats */}
          <View style={styles.quickStats}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Hábitos hoy</Text>
              <Text style={styles.statValue}>
                {completedCount}/{totalCount}
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Racha máxima</Text>
              <Text style={styles.statValue}>🔥 {bestStreak}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Tareas urgentes</Text>
              <Text style={styles.statValue}>{overdueTasks}</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Card 1: Hoy - Completion Rate */}
      <StatsCard
        title="Hábitos de Hoy"
        onPress={handleTodayCardPress}
        onPressAll={() => navigation.navigate('HabitsTab', { screen: 'HabitosHoy' })}
      >
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
          onPress={() => navigation.navigate('HabitsTab', { screen: 'HabitsList' })}
        >
          <Text style={styles.actionButtonText}>🎯 Ver Mis Hábitos</Text>
        </TouchableOpacity>
      </View>

      {/* Upcoming Tasks Section - Sprint 5 */}
      {upcomingTasks.length > 0 && (
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>📋 Tareas Urgentes</Text>
            <TouchableOpacity onPress={() => navigation.navigate('TasksTab')}>
              <Text style={styles.seeAllText}>Ver todas →</Text>
            </TouchableOpacity>
          </View>

          {upcomingTasks.map((task) => {
            const dueDate = new Date(task.dueDate!);
            const priorityColors = {
              alta: '#EF4444',
              media: '#F59E0B',
              baja: '#10B981',
            };

            return (
              <View key={task.id} style={styles.taskCard}>
                <View style={styles.taskLeft}>
                  <View
                    style={[styles.priorityDot, { backgroundColor: priorityColors[task.priority] }]}
                  />
                  <View style={styles.taskInfo}>
                    <Text style={styles.taskTitle} numberOfLines={1}>
                      {task.title}
                    </Text>
                    <Text style={styles.taskDue}>
                      {isToday(dueDate)
                        ? 'Hoy'
                        : isTomorrow(dueDate)
                          ? 'Mañana'
                          : format(dueDate, "EEE d 'de' MMM", { locale: es })}
                      {isPast(dueDate) && ' (Vencida)'}
                    </Text>
                  </View>
                </View>
                {task.category?.icon && <Text style={styles.taskIcon}>{task.category.icon}</Text>}
              </View>
            );
          })}
        </View>
      )}

      {/* Fitness Section - Sprint 14 */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>💪 Fitness</Text>
        <View style={styles.fitnessGrid}>
          <TouchableOpacity
            style={styles.fitnessCard}
            onPress={() => navigation.navigate('MoreTab', { screen: 'Exercises' })}
          >
            <Text style={styles.fitnessIcon}>💪</Text>
            <Text style={styles.fitnessLabel}>Ejercicios</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.fitnessCard}
            onPress={() => navigation.navigate('MoreTab', { screen: 'Routines' })}
          >
            <Text style={styles.fitnessIcon}>📋</Text>
            <Text style={styles.fitnessLabel}>Rutinas</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.fitnessCard}
            onPress={() => navigation.navigate('MoreTab', { screen: 'WorkoutHistory' })}
          >
            <Text style={styles.fitnessIcon}>📊</Text>
            <Text style={styles.fitnessLabel}>Historial</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.fitnessCard}
            onPress={() => navigation.navigate('MoreTab', { screen: 'Stats' })}
          >
            <Text style={styles.fitnessIcon}>📈</Text>
            <Text style={styles.fitnessLabel}>Estadísticas</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Finance Section - Sprint 2 */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>💰 Finanzas</Text>

        {/* Account Balances Summary */}
        {totalsByCurrency.length > 0 && (
          <View style={styles.financeCard}>
            <Text style={styles.financeCardTitle}>Balance Total</Text>
            {totalsByCurrency.map((total) => (
              <Text key={total.currency} style={styles.balanceText}>
                {total.currency}{' '}
                {Number(total.total ?? 0).toLocaleString('es-AR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            ))}
          </View>
        )}

        {/* Pending Expenses */}
        {pendingExpenses.length > 0 && (
          <View style={[styles.financeCard, { marginTop: 12 }]}>
            <View style={styles.financeCardHeader}>
              <Text style={styles.financeCardTitle}>Gastos Pendientes</Text>
              <Text style={styles.pendingCount}>{pendingExpenses.length}</Text>
            </View>
            <Text style={styles.pendingAmount}>
              ${' '}
              {pendingExpenses
                .reduce((sum, exp) => sum + Number(exp.amount ?? 0), 0)
                .toLocaleString('es-AR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
            </Text>
            <Text style={styles.pendingSubtext}>Estimado para este mes</Text>
          </View>
        )}

        {/* Quick Access Button */}
        <TouchableOpacity
          style={styles.financeButton}
          onPress={() => navigation.navigate('FinanceTab')}
        >
          <Text style={styles.financeButtonIcon}>💰</Text>
          <View style={styles.financeButtonTextContainer}>
            <Text style={styles.financeButtonText}>Ir a Finanzas</Text>
            <Text style={styles.financeButtonSubtext}>Cuentas, transacciones y gastos</Text>
          </View>
          <Text style={styles.financeButtonArrow}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Resources Section - Fase 3 */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>📚 Conocimiento</Text>
        <TouchableOpacity
          style={styles.resourcesButton}
          onPress={() => navigation.navigate('MoreTab', { screen: 'Resources' })}
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
  // Hero section styles - Sprint 3
  heroSection: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  heroContent: {
    padding: 24,
    paddingTop: 28,
    paddingBottom: 28,
  },
  greetingText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 20,
    marginBottom: 24,
  },
  quickStats: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    marginBottom: 16,
    textAlign: 'center',
    paddingHorizontal: 24,
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
  // Tasks section styles - Sprint 5
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
  },
  taskCard: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  taskLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  taskDue: {
    fontSize: 12,
    color: '#666',
  },
  taskIcon: {
    fontSize: 20,
    marginLeft: 8,
  },
  // Finance section styles - Sprint 2
  financeCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  financeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  financeCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  balanceText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4F46E5',
    marginBottom: 4,
  },
  pendingCount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F59E0B',
  },
  pendingAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F59E0B',
    marginBottom: 4,
  },
  pendingSubtext: {
    fontSize: 12,
    color: '#999',
  },
  financeButton: {
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
    marginTop: 12,
  },
  financeButtonIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  financeButtonTextContainer: {
    flex: 1,
  },
  financeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  financeButtonSubtext: {
    fontSize: 12,
    color: '#666',
  },
  financeButtonArrow: {
    fontSize: 24,
    color: '#4F46E5',
    marginLeft: 8,
  },
});
