/**
 * HabitDailyCard Component
 * Sprint 4 - US-033, US-034
 *
 * Card for daily habit tracking with interactive marking
 * Supports both CHECK and NUMERIC habits
 * Shows streak badge, category color, and completion status
 * Includes celebration callbacks (US-034)
 */

import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import type { Habit, HabitRecord } from '../../api/habits.api';
import { HabitCheckbox } from './HabitCheckbox';
import { HabitNumericInput } from './HabitNumericInput';

interface HabitDailyCardProps {
  habit: Habit;
  record?: HabitRecord | null;
  onToggleCheck: (completed: boolean) => void;
  onIncrementNumeric: () => void;
  onDecrementNumeric: () => void;
  onNumericValueChange: (value: number) => void;
  onCelebrate?: () => void; // US-034: Called when habit is completed
  isLoading?: boolean;
}

export const HabitDailyCard = ({
  habit,
  record,
  onToggleCheck,
  onIncrementNumeric,
  onDecrementNumeric,
  onNumericValueChange,
  onCelebrate,
  isLoading = false,
}: HabitDailyCardProps) => {
  const cardColor = habit.color || habit.category.color || '#9E9E9E';
  const typeColor = habit.type === 'CHECK' ? '#4CAF50' : '#2196F3';
  const isCompleted = record?.completed || false;
  const currentValue = record?.value || 0;
  const showStreakBadge = habit.currentStreak > 0;

  return (
    <View style={[styles.card, { borderLeftColor: cardColor }]}>
      {/* Header Row */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Text style={styles.categoryIcon}>{habit.category.icon || '📌'}</Text>
        </View>
        <View style={styles.headerContent}>
          <Text style={styles.name} numberOfLines={1}>
            {habit.name}
          </Text>
          <View style={styles.metaRow}>
            <View style={[styles.typeBadge, { backgroundColor: typeColor }]}>
              <Text style={styles.typeBadgeText}>{habit.type === 'CHECK' ? '✓' : '#'}</Text>
            </View>
            <Text style={styles.categoryName} numberOfLines={1}>
              {habit.category.name}
            </Text>
          </View>
        </View>

        {/* Streak Badge */}
        {showStreakBadge && (
          <View style={styles.streakBadge}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <Text style={styles.streakText}>{habit.currentStreak}</Text>
          </View>
        )}
      </View>

      {/* Description (if exists) */}
      {habit.description && (
        <Text style={styles.description} numberOfLines={2}>
          {habit.description}
        </Text>
      )}

      {/* Interactive Controls */}
      <View style={styles.controlsContainer}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={typeColor} />
            <Text style={styles.loadingText}>Guardando...</Text>
          </View>
        ) : habit.type === 'CHECK' ? (
          <View style={styles.checkboxContainer}>
            <HabitCheckbox
              checked={isCompleted}
              onToggle={() => onToggleCheck(!isCompleted)}
              color={typeColor}
              onCelebrate={onCelebrate}
            />
            <Text style={[styles.checkLabel, isCompleted && styles.checkLabelCompleted]}>
              {isCompleted ? '¡Completado!' : 'Marcar como completado'}
            </Text>
          </View>
        ) : (
          <HabitNumericInput
            value={currentValue}
            targetValue={habit.targetValue}
            unit={habit.unit}
            onIncrement={onIncrementNumeric}
            onDecrement={onDecrementNumeric}
            onValueChange={onNumericValueChange}
            color={typeColor}
            onCelebrate={onCelebrate}
          />
        )}
      </View>

      {/* Footer with best streak (if exists) */}
      {habit.longestStreak > 0 && (
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Mejor racha: {habit.longestStreak} día{habit.longestStreak !== 1 ? 's' : ''}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryIcon: {
    fontSize: 24,
  },
  headerContent: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 8,
  },
  typeBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  categoryName: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 8,
  },
  streakEmoji: {
    fontSize: 16,
    marginRight: 4,
  },
  streakText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F57C00',
  },
  description: {
    fontSize: 14,
    color: '#757575',
    lineHeight: 20,
    marginBottom: 16,
  },
  controlsContainer: {
    marginTop: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkLabel: {
    fontSize: 16,
    color: '#666',
    marginLeft: 12,
    fontWeight: '500',
  },
  checkLabelCompleted: {
    color: '#4CAF50',
    fontWeight: '700',
  },
  footer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  footerText: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
  },
});
