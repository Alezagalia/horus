/**
 * RetroactiveMarkingSheet Component
 * Sprint 5 - US-043
 *
 * Bottom sheet for marking habits from previous days (up to 7 days ago).
 * Shows date selector and list of habits that should have been completed.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import { type Habit, markHabitRetroactively } from '../../api/habits.api';
import { DateSelector } from './DateSelector';
import { HabitCheckbox } from './HabitCheckbox';

interface RetroactiveMarkingSheetProps {
  bottomSheetRef: React.RefObject<BottomSheet>;
  habits: Habit[];
  onSuccess: () => void;
  onError: (message: string) => void;
}

interface HabitState {
  habitId: string;
  completed: boolean;
  value?: number;
}

export const RetroactiveMarkingSheet: React.FC<RetroactiveMarkingSheetProps> = ({
  bottomSheetRef,
  habits,
  onSuccess,
  onError,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [habitStates, setHabitStates] = useState<Record<string, HabitState>>({});
  const [saving, setSaving] = useState(false);

  // Initialize with yesterday's date
  useEffect(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    setSelectedDate(yesterday.toISOString().split('T')[0]);
  }, []);

  // Filter habits that should be done on selected date
  const getHabitsForDate = (): Habit[] => {
    if (!selectedDate) return [];

    const date = new Date(selectedDate);
    const dayOfWeek = date.getDay(); // 0 = Sunday

    return habits.filter((habit) => {
      if (!habit.isActive) return false;

      switch (habit.periodicity) {
        case 'DAILY':
          // If weekDays is empty, it's every day
          if (habit.weekDays.length === 0) return true;
          return habit.weekDays.includes(dayOfWeek);

        case 'WEEKLY':
          return habit.weekDays.includes(dayOfWeek);

        case 'MONTHLY':
          // For monthly, check if it's the same day of month as creation
          return date.getDate() === new Date(habit.createdAt).getDate();

        case 'CUSTOM':
          if (habit.weekDays.length > 0) {
            return habit.weekDays.includes(dayOfWeek);
          }
          return true;

        default:
          return false;
      }
    });
  };

  const habitsForDate = getHabitsForDate();

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setHabitStates({}); // Reset states when date changes
  };

  const handleCheckboxToggle = (habitId: string, completed: boolean) => {
    setHabitStates((prev) => ({
      ...prev,
      [habitId]: {
        habitId,
        completed,
      },
    }));
  };

  const handleNumericValueChange = (habitId: string, value: number) => {
    setHabitStates((prev) => ({
      ...prev,
      [habitId]: {
        habitId,
        completed: value > 0,
        value,
      },
    }));
  };

  const handleSave = async () => {
    const habitsToMark = Object.values(habitStates).filter((state) => state.completed);

    if (habitsToMark.length === 0) {
      onError('Selecciona al menos un hábito para marcar');
      return;
    }

    setSaving(true);

    try {
      // Mark all habits in parallel
      const results = await Promise.allSettled(
        habitsToMark.map((state) =>
          markHabitRetroactively(state.habitId, {
            date: selectedDate,
            completed: state.completed,
            value: state.value,
          })
        )
      );

      // Check results
      const successful = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;

      if (failed === 0) {
        onSuccess();
        bottomSheetRef.current?.close();
      } else if (successful > 0) {
        onError(`${successful} hábitos guardados, ${failed} fallaron. Reintenta los fallidos.`);
      } else {
        onError('Error al guardar hábitos. Verifica tu conexión.');
      }
    } catch {
      onError('Error inesperado al guardar hábitos');
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={['75%']}
      enablePanDownToClose
      backgroundStyle={styles.bottomSheet}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Marcar Día Anterior</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Date Selector */}
          <DateSelector selectedDate={selectedDate} onDateSelect={handleDateSelect} />

          {/* Habits List */}
          {habitsForDate.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No hay hábitos programados para esta fecha</Text>
            </View>
          ) : (
            <View style={styles.habitsList}>
              <Text style={styles.sectionTitle}>Hábitos de {getFormattedDate(selectedDate)}</Text>
              {habitsForDate.map((habit) => (
                <View key={habit.id} style={styles.habitCard}>
                  <View style={styles.habitInfo}>
                    <Text style={styles.habitName}>{habit.name}</Text>
                    {habit.type === 'NUMERIC' && habit.targetValue && (
                      <Text style={styles.habitTarget}>
                        Meta: {habit.targetValue} {habit.unit || ''}
                      </Text>
                    )}
                  </View>

                  {habit.type === 'CHECK' ? (
                    <HabitCheckbox
                      checked={habitStates[habit.id]?.completed || false}
                      onToggle={() => {
                        const currentState = habitStates[habit.id]?.completed || false;
                        handleCheckboxToggle(habit.id, !currentState);
                      }}
                    />
                  ) : (
                    <TextInput
                      style={styles.numericInput}
                      keyboardType="numeric"
                      placeholder={`0 ${habit.unit || ''}`}
                      value={habitStates[habit.id]?.value?.toString() || ''}
                      onChangeText={(text) => {
                        const value = parseFloat(text) || 0;
                        handleNumericValueChange(habit.id, value);
                      }}
                    />
                  )}
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Save Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving || habitsForDate.length === 0}
            activeOpacity={0.7}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Guardar</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheet>
  );
};

const getFormattedDate = (dateString: string): string => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Hoy';
  if (date.toDateString() === yesterday.toDateString()) return 'Ayer';

  return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
};

const styles = StyleSheet.create({
  bottomSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  habitsList: {
    marginBottom: 20,
  },
  habitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  habitInfo: {
    flex: 1,
    marginRight: 12,
  },
  habitName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  habitTarget: {
    fontSize: 12,
    color: '#666',
  },
  numericInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    minWidth: 80,
    textAlign: 'center',
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  saveButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#B0BEC5',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
