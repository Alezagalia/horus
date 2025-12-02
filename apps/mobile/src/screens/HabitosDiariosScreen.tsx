/**
 * HabitosDiariosScreen - Daily Habits Screen
 * Sprint 4 - US-033, US-034
 *
 * Main screen for marking daily habits with interactive controls
 * - Groups habits by time of day (morning, afternoon, evening, anytime)
 * - Supports CHECK and NUMERIC habits
 * - Optimistic updates with TanStack Query
 * - Pull-to-refresh functionality
 * - Loading states and error handling
 * - Celebrations and animations (US-034)
 */

import { useState, useRef } from 'react';
import {
  View,
  Text,
  SectionList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import BottomSheet from '@gorhom/bottom-sheet';
import {
  getHabits,
  markHabitForDate,
  updateHabitProgress,
  type Habit,
  type HabitRecord,
} from '../api/habits.api';
import { HabitDailyCard } from '../components/habits/HabitDailyCard';
import { EmptyState } from '../components/common/EmptyState';
import { Toast } from '../components/common/Toast';
import { CelebrationOverlay } from '../components/habits/CelebrationOverlay';
import { RetroactiveMarkingSheet } from '../components/habits/RetroactiveMarkingSheet';

const TIME_OF_DAY_LABELS = {
  MANANA: '🌅 Mañana',
  TARDE: '☀️ Tarde',
  NOCHE: '🌙 Noche',
  ANYTIME: '⏰ Todo el día',
} as const;

interface HabitWithRecord {
  habit: Habit;
  record?: HabitRecord | null;
}

interface SectionData {
  title: string;
  data: HabitWithRecord[];
}

export function HabitosDiariosScreen() {
  const queryClient = useQueryClient();
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');
  const [loadingHabitId, setLoadingHabitId] = useState<string | null>(null);

  // US-034: Celebration state
  const [celebrationVisible, setCelebrationVisible] = useState(false);
  const [celebrationType, setCelebrationType] = useState<'completion' | 'streak' | 'record'>(
    'completion'
  );
  const [celebrationData, setCelebrationData] = useState({ streakCount: 0, habitName: '' });
  const celebratedHabitsRef = useRef<Set<string>>(new Set()); // Track shown celebrations

  // US-043: Retroactive marking bottom sheet
  const retroactiveSheetRef = useRef<BottomSheet>(null!);

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  // Fetch all active habits
  const {
    data: habits = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['habits'],
    queryFn: () => getHabits(),
  });

  // Filter only active habits
  const activeHabits = habits.filter((h) => h.isActive);

  // Mutation for marking CHECK habits
  const markHabitMutation = useMutation({
    mutationFn: ({ habitId, completed }: { habitId: string; completed: boolean }) =>
      markHabitForDate(habitId, today, {
        completed,
      }),
    onMutate: async ({ habitId, completed }) => {
      setLoadingHabitId(habitId);

      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['habits'] });

      // Optimistic update
      const previousHabits = queryClient.getQueryData<Habit[]>(['habits']);

      queryClient.setQueryData<Habit[]>(['habits'], (old = []) =>
        old.map((h) =>
          h.id === habitId
            ? {
                ...h,
                currentStreak: completed ? h.currentStreak + 1 : 0,
              }
            : h
        )
      );

      return { previousHabits };
    },
    onSuccess: () => {
      // US-045: Invalidate habits and stats cache
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['generalStats'] });
      queryClient.invalidateQueries({ queryKey: ['habitStats'] });
      setLoadingHabitId(null);
    },
    onError: (_error, _variables, context) => {
      // Rollback on error
      if (context?.previousHabits) {
        queryClient.setQueryData(['habits'], context.previousHabits);
      }
      setLoadingHabitId(null);
      showToast('Error al marcar el hábito. Intenta de nuevo.');
    },
  });

  // Mutation for updating NUMERIC habits progress
  const updateProgressMutation = useMutation({
    mutationFn: ({ habitId, increment }: { habitId: string; increment: number }) =>
      updateHabitProgress(habitId, today, { increment }),
    onMutate: async ({ habitId }) => {
      setLoadingHabitId(habitId);
      await queryClient.cancelQueries({ queryKey: ['habits'] });
    },
    onSuccess: () => {
      // US-045: Invalidate habits and stats cache
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['generalStats'] });
      queryClient.invalidateQueries({ queryKey: ['habitStats'] });
      setLoadingHabitId(null);
    },
    onError: () => {
      setLoadingHabitId(null);
      showToast('Error al actualizar el progreso. Intenta de nuevo.');
    },
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'error') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  // US-043: Handlers for retroactive marking
  const handleRetroactiveSuccess = () => {
    // US-045: Invalidate all caches after retroactive marking
    refetch(); // Refresh habits to update streaks
    queryClient.invalidateQueries({ queryKey: ['generalStats'] });
    queryClient.invalidateQueries({ queryKey: ['habitStats'] });
    showToast('Hábitos marcados correctamente', 'success');
  };

  const handleRetroactiveError = (message: string) => {
    showToast(message, 'error');
  };

  const handleOpenRetroactiveSheet = () => {
    retroactiveSheetRef.current?.expand();
  };

  // Group habits by time of day
  const groupedHabits: SectionData[] = [
    {
      title: TIME_OF_DAY_LABELS.MANANA,
      data: activeHabits.filter((h) => h.timeOfDay === 'MANANA').map((habit) => ({ habit })),
    },
    {
      title: TIME_OF_DAY_LABELS.TARDE,
      data: activeHabits.filter((h) => h.timeOfDay === 'TARDE').map((habit) => ({ habit })),
    },
    {
      title: TIME_OF_DAY_LABELS.NOCHE,
      data: activeHabits.filter((h) => h.timeOfDay === 'NOCHE').map((habit) => ({ habit })),
    },
    {
      title: TIME_OF_DAY_LABELS.ANYTIME,
      data: activeHabits.filter((h) => h.timeOfDay === 'ANYTIME').map((habit) => ({ habit })),
    },
  ].filter((section) => section.data.length > 0);

  const handleToggleCheck = (habitId: string, completed: boolean) => {
    markHabitMutation.mutate({ habitId, completed });
  };

  // US-034: Handle celebration when habit is completed
  const handleCelebration = (habit: Habit, wasJustCompleted: boolean) => {
    if (!wasJustCompleted) return; // Don't celebrate if already completed

    // Check if we already celebrated this habit today
    const celebrationKey = `${habit.id}-${today}`;
    if (celebratedHabitsRef.current.has(celebrationKey)) return;

    celebratedHabitsRef.current.add(celebrationKey);

    // Determine celebration type
    const newStreak = habit.currentStreak + 1; // Will be updated after mutation
    const isNewRecord = newStreak > habit.longestStreak;

    if (isNewRecord) {
      // Personal record - most important celebration
      setCelebrationType('record');
      setCelebrationData({ streakCount: newStreak, habitName: habit.name });
      setCelebrationVisible(true);
    } else if (newStreak > 5) {
      // Streak > 5 - confetti celebration
      setCelebrationType('streak');
      setCelebrationData({ streakCount: newStreak, habitName: habit.name });
      setCelebrationVisible(true);
    } else {
      // Normal completion - simple celebration
      setCelebrationType('completion');
      setCelebrationData({ streakCount: newStreak, habitName: habit.name });
      setCelebrationVisible(true);
    }
  };

  const handleIncrementNumeric = (habitId: string) => {
    updateProgressMutation.mutate({ habitId, increment: 1 });
  };

  const handleDecrementNumeric = (habitId: string) => {
    updateProgressMutation.mutate({ habitId, increment: -1 });
  };

  const handleNumericValueChange = (habitId: string, currentValue: number, newValue: number) => {
    const increment = newValue - currentValue;
    if (increment !== 0) {
      updateProgressMutation.mutate({ habitId, increment });
    }
  };

  const renderSectionHeader = ({ section }: { section: SectionData }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <View style={styles.sectionBadge}>
        <Text style={styles.sectionBadgeText}>{section.data.length}</Text>
      </View>
    </View>
  );

  const renderItem = ({ item }: { item: HabitWithRecord }) => {
    const wasCompleted = item.record?.completed || false;

    return (
      <HabitDailyCard
        habit={item.habit}
        record={item.record}
        onToggleCheck={(completed) => {
          handleToggleCheck(item.habit.id, completed);
          // US-034: Trigger celebration when checking (not unchecking)
          if (completed && !wasCompleted) {
            handleCelebration(item.habit, true);
          }
        }}
        onIncrementNumeric={() => handleIncrementNumeric(item.habit.id)}
        onDecrementNumeric={() => handleDecrementNumeric(item.habit.id)}
        onNumericValueChange={(value) =>
          handleNumericValueChange(item.habit.id, item.record?.value || 0, value)
        }
        onCelebrate={() => {
          // US-034: Celebration for NUMERIC habits when completing
          const wasNotCompleted = !wasCompleted;
          if (wasNotCompleted) {
            handleCelebration(item.habit, true);
          }
        }}
        isLoading={loadingHabitId === item.habit.id}
      />
    );
  };

  const renderEmptyState = () => (
    <EmptyState
      icon="🎯"
      title="No tienes hábitos para hoy"
      description="Crea hábitos para empezar a seguir tus objetivos diarios"
    />
  );

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Cargando hábitos del día...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Hábitos de Hoy</Text>
            <Text style={styles.headerDate}>
              {new Date().toLocaleDateString('es-ES', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </Text>
          </View>

          {/* US-043: Retroactive marking button */}
          <TouchableOpacity style={styles.retroactiveButton} onPress={handleOpenRetroactiveSheet}>
            <Text style={styles.retroactiveButtonIcon}>📅</Text>
            <Text style={styles.retroactiveButtonText}>Marcar{'\n'}día anterior</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Habits List */}
      <SectionList
        sections={groupedHabits}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        keyExtractor={(item) => item.habit.id}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={['#2196F3']} />
        }
        ListEmptyComponent={renderEmptyState}
      />

      {/* Toast for errors/success */}
      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onDismiss={() => setToastVisible(false)}
        duration={3000}
      />

      {/* US-034: Celebration Overlay */}
      <CelebrationOverlay
        visible={celebrationVisible}
        celebrationType={celebrationType}
        streakCount={celebrationData.streakCount}
        habitName={celebrationData.habitName}
        onDismiss={() => setCelebrationVisible(false)}
      />

      {/* US-043: Retroactive Marking Bottom Sheet */}
      <RetroactiveMarkingSheet
        bottomSheetRef={retroactiveSheetRef}
        habits={activeHabits}
        onSuccess={handleRetroactiveSuccess}
        onError={handleRetroactiveError}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#212121',
    marginBottom: 4,
  },
  headerDate: {
    fontSize: 15,
    color: '#666',
    textTransform: 'capitalize',
  },
  retroactiveButton: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFB74D',
    minWidth: 80,
  },
  retroactiveButtonIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  retroactiveButtonText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#F57C00',
    textAlign: 'center',
    lineHeight: 12,
  },
  list: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212121',
  },
  sectionBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sectionBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1976D2',
  },
});
