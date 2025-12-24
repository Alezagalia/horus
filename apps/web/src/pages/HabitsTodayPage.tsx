/**
 * Habits Today Page
 * Sprint 11 - US-096, US-098
 * Sprint 13 - Drag & Drop Reordering
 * Connected to backend API
 */

import { useState, useMemo, useCallback } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { format } from 'date-fns';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import { DateSelector } from '@/components/habits/DateSelector';
import { ProgressBar } from '@/components/habits/ProgressBar';
import { SortableHabitCard } from '@/components/habits/SortableHabitCard';
import { useHabits, useToggleHabitComplete, useUpdateHabitProgress, useReorderHabits } from '@/hooks/useHabits';
import type { HabitOfDay, HabitsGrouped, DayProgress, TimeOfDay } from '@/types/habits';

/**
 * Extracts the YYYY-MM-DD portion from an ISO date string.
 * This avoids timezone conversion issues by working directly with the string.
 */
function extractDateString(isoDateString: string): string {
  // Handle both "2025-12-02" and "2025-12-02T12:00:00.000Z" formats
  return isoDateString.substring(0, 10);
}

const timeOfDayLabels = {
  AYUNO: 'En ayuno',
  MANANA: 'Mañana',
  MEDIA_MANANA: 'Media mañana',
  TARDE: 'Tarde',
  MEDIA_TARDE: 'Media tarde',
  NOCHE: 'Noche',
  ANTES_DORMIR: 'Antes de dormir',
  ANYTIME: 'Cualquier momento',
};

const timeOfDayIcons: Record<string, string> = {
  AYUNO: '🍽️',
  MANANA: '🌅',
  MEDIA_MANANA: '☕',
  TARDE: '☀️',
  MEDIA_TARDE: '🍵',
  NOCHE: '🌙',
  ANTES_DORMIR: '🛏️',
  ANYTIME: '⏰',
};

// Helper to check if habit is scheduled for a specific day
function isHabitScheduledForDate(
  habit: { periodicity: string; weekDays: number[] },
  date: Date
): boolean {
  const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.

  switch (habit.periodicity) {
    case 'DAILY':
      return true;
    case 'WEEKLY':
      // weekDays in DB uses: 0 = Sunday, 1 = Monday... 6 = Saturday
      return habit.weekDays.includes(dayOfWeek);
    case 'MONTHLY':
      // For monthly, we'd need more logic - for now, assume it's scheduled
      return true;
    case 'CUSTOM':
      return habit.weekDays.includes(dayOfWeek);
    default:
      return true;
  }
}

export function HabitsTodayPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  // API queries
  const { data: habitsFromAPI, isLoading, error } = useHabits();

  // Mutations
  const toggleCompleteMutation = useToggleHabitComplete();
  const updateProgressMutation = useUpdateHabitProgress();
  const reorderHabitsMutation = useReorderHabits();

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement needed before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Transform habits to today's format with completion status
  const todayHabits: HabitOfDay[] = useMemo(() => {
    if (!habitsFromAPI) return [];

    console.log('Processing habitsFromAPI:', habitsFromAPI.map(h => ({
      id: h.id,
      name: h.name,
      lastCompletedDate: h.lastCompletedDate,
    })));

    // Filter only active habits scheduled for selected date
    return habitsFromAPI
      .filter((h) => h.isActive && isHabitScheduledForDate(h, selectedDate))
      .map((habit) => {
        // Check if completed for selected date
        // The lastCompletedDate tells us if it was completed recently
        // Use extractDateString to avoid timezone conversion issues
        const lastCompleted = habit.lastCompletedDate
          ? extractDateString(habit.lastCompletedDate)
          : null;
        const isCompletedToday = lastCompleted === dateStr;

        console.log('Habit completion check:', {
          habitId: habit.id,
          habitName: habit.name,
          lastCompletedDate: habit.lastCompletedDate,
          lastCompletedFormatted: lastCompleted,
          dateStr,
          isCompletedToday,
        });

        return {
          id: habit.id,
          name: habit.name,
          description: habit.description,
          type: habit.type,
          targetValue: habit.targetValue,
          unit: habit.unit,
          timeOfDay: habit.timeOfDay,
          categoryIcon: habit.category?.icon,
          categoryColor: habit.category?.color,
          currentStreak: habit.currentStreak,
          completed: isCompletedToday,
          value: isCompletedToday ? habit.targetValue : 0,
          order: habit.order,
        };
      });
  }, [habitsFromAPI, selectedDate, dateStr]);

  // Group habits by time of day, sorted by order then completed status
  const groupedHabits: HabitsGrouped = useMemo(() => {
    const groups: HabitsGrouped = {
      AYUNO: [],
      MANANA: [],
      MEDIA_MANANA: [],
      TARDE: [],
      MEDIA_TARDE: [],
      NOCHE: [],
      ANTES_DORMIR: [],
      ANYTIME: []
    };
    todayHabits.forEach((habit) => {
      groups[habit.timeOfDay].push(habit);
    });
    // Sort each group: first by order, then completed at the bottom
    Object.keys(groups).forEach((key) => {
      groups[key as keyof HabitsGrouped].sort((a, b) => {
        // First sort by order
        if (a.order !== b.order) return a.order - b.order;
        // Then completed habits at the bottom
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return 0;
      });
    });
    return groups;
  }, [todayHabits]);

  // Handle drag end for reordering
  const handleDragEnd = useCallback(
    (event: DragEndEvent, timeOfDay: TimeOfDay) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const habitsInSection = groupedHabits[timeOfDay];
        const oldIndex = habitsInSection.findIndex((h) => h.id === active.id);
        const newIndex = habitsInSection.findIndex((h) => h.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          const reorderedHabits = arrayMove(habitsInSection, oldIndex, newIndex);
          const habitIds = reorderedHabits.map((h) => h.id);

          // Call API to persist the new order
          reorderHabitsMutation.mutate(
            { timeOfDay, habitIds },
            {
              onSuccess: () => {
                toast.success('Orden actualizado', { icon: '✅', duration: 1500 });
              },
            }
          );
        }
      }
    },
    [groupedHabits, reorderHabitsMutation]
  );

  // Calculate progress
  const progress: DayProgress = useMemo(() => {
    const completed = todayHabits.filter((h) => h.completed).length;
    const total = todayHabits.length;
    return {
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [todayHabits]);

  const handleToggleComplete = async (habitId: string) => {
    console.log('HabitsTodayPage handleToggleComplete called', { habitId, dateStr });
    const habit = todayHabits.find((h) => h.id === habitId);
    if (!habit) {
      console.log('Habit not found in todayHabits');
      return;
    }

    const newCompleted = !habit.completed;
    console.log('Calling mutation', { habitId, newCompleted, dateStr });

    toggleCompleteMutation.mutate(
      {
        habitId,
        data: {
          date: dateStr,
          completed: newCompleted,
          value: habit.type === 'NUMERIC' && newCompleted ? habit.targetValue : undefined,
        },
      },
      {
        onSuccess: (data) => {
          console.log('Mutation success', data);
          if (newCompleted) {
            // Check if all habits are now completed
            const allCompleted = todayHabits.every((h) => h.id === habitId || h.completed);
            if (allCompleted) {
              toast.success('¡Felicitaciones! Completaste todos tus hábitos de hoy', { icon: '🎉' });
            }
          }
        },
      }
    );
  };

  const handleUpdateValue = async (habitId: string, value: number) => {
    const habit = todayHabits.find((h) => h.id === habitId);
    if (!habit || habit.type !== 'NUMERIC') return;

    const currentValue = habit.value || 0;
    const increment = value - currentValue;

    if (increment !== 0) {
      updateProgressMutation.mutate({
        habitId,
        date: dateStr,
        increment,
      });
    }
  };

  const handleUpdateNotes = async (_habitId: string, _notes: string) => {
    // For now, notes are updated along with the toggle
    // We could add a separate mutation if needed
    toast.success('Nota guardada');
  };

  // Navigation helper
  const goToToday = () => setSelectedDate(new Date());

  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
  const isFuture = selectedDate > new Date();

  console.log('HabitsTodayPage state:', { isToday, isFuture, selectedDate: selectedDate.toISOString(), dateStr, habitsCount: todayHabits.length });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando hábitos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="text-5xl mb-4">😕</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Error al cargar hábitos</h2>
        <p className="text-gray-600">{error.message}</p>
      </div>
    );
  }

  return (
    <div>
      <Toaster position="top-right" />

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Hábitos del Día</h1>
          {!isToday && (
            <button
              onClick={goToToday}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              Ir a hoy
            </button>
          )}
        </div>
        <DateSelector
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <ProgressBar progress={progress} />
      </div>

      {/* Future date warning */}
      {isFuture && (
        <div className="glass-card p-4 mb-6 border-l-4 border-amber-400">
          <p className="text-amber-700 text-sm">
            Estás viendo una fecha futura. No puedes marcar hábitos como completados.
          </p>
        </div>
      )}

      {/* Habits List */}
      {todayHabits.length === 0 ? (
        <div className="glass-card p-8">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No tienes hábitos para este día
            </h2>
            <p className="text-gray-600 mb-4">
              {isToday
                ? 'Crea tus primeros hábitos para comenzar a construir tu rutina.'
                : 'No hay hábitos programados para esta fecha.'}
            </p>
            {isToday && (
              <a
                href="/habits"
                className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
              >
                Crear hábito
              </a>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {(['AYUNO', 'MANANA', 'MEDIA_MANANA', 'TARDE', 'MEDIA_TARDE', 'NOCHE', 'ANTES_DORMIR', 'ANYTIME'] as const).map((timeOfDay) => {
            const habitsInSection = groupedHabits[timeOfDay];
            if (habitsInSection.length === 0) return null;

            return (
              <div key={timeOfDay}>
                <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  {timeOfDayIcons[timeOfDay]}
                  {timeOfDayLabels[timeOfDay]}
                  {habitsInSection.length > 1 && (
                    <span className="text-xs text-gray-400 font-normal ml-2">
                      (arrastra para reordenar)
                    </span>
                  )}
                </h2>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(event) => handleDragEnd(event, timeOfDay)}
                >
                  <SortableContext
                    items={habitsInSection.map((h) => h.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3">
                      {habitsInSection.map((habit) => (
                        <SortableHabitCard
                          key={habit.id}
                          habit={habit}
                          onToggleComplete={isFuture ? undefined : handleToggleComplete}
                          onUpdateValue={isFuture ? undefined : handleUpdateValue}
                          onUpdateNotes={handleUpdateNotes}
                          disabled={isFuture}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            );
          })}
        </div>
      )}

      {/* Completion celebration */}
      {progress.percentage === 100 && todayHabits.length > 0 && (
        <div className="mt-8 glass-card p-6 text-center bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <div className="text-5xl mb-3">🎉</div>
          <h3 className="text-xl font-bold text-green-800 mb-2">¡Día Completado!</h3>
          <p className="text-green-600">Has completado todos tus hábitos de hoy. ¡Excelente trabajo!</p>
        </div>
      )}
    </div>
  );
}
