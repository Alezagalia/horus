/**
 * HabitCard Component
 * Sprint 3 - US-022, US-024
 * Sprint 6 - US-053: Added support for inactive habits with reactivate action
 * Sprint 12 - US-108: Optimized with React.memo for performance
 *
 * Card displaying habit information with icon, name, type, periodicity
 * Supports swipe-to-delete action for active habits
 * Supports swipe-to-reactivate action for inactive habits
 */

import { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import type { Habit } from '../../api/habits.api';

interface HabitCardProps {
  habit: Habit;
  onPress: (habit: Habit) => void;
  onDelete?: (habit: Habit) => void;
  onReactivate?: (habit: Habit) => void;
}

const PERIODICITY_LABELS: Record<string, string> = {
  DAILY: 'Diario',
  WEEKLY: 'Semanal',
  MONTHLY: 'Mensual',
  CUSTOM: 'Personalizado',
};

const TIME_OF_DAY_ICONS: Record<string, string> = {
  MANANA: '🌅',
  TARDE: '☀️',
  NOCHE: '🌙',
  ANYTIME: '⏰',
};

export const HabitCard = memo(({ habit, onPress, onDelete, onReactivate }: HabitCardProps) => {
  const typeColor = habit.type === 'CHECK' ? '#4CAF50' : '#2196F3';
  const cardColor = habit.color || habit.category.color || '#9E9E9E';
  const isInactive = !habit.isActive;

  const renderRightActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    // Reactivate action for inactive habits
    if (isInactive && onReactivate) {
      return (
        <TouchableOpacity
          style={styles.reactivateAction}
          onPress={() => onReactivate(habit)}
          activeOpacity={0.7}
        >
          <Animated.View style={{ transform: [{ scale }] }}>
            <Text style={styles.reactivateIcon}>🔄</Text>
            <Text style={styles.reactivateText}>Reactivar</Text>
          </Animated.View>
        </TouchableOpacity>
      );
    }

    // Delete action for active habits
    return (
      <TouchableOpacity
        style={styles.deleteAction}
        onPress={() => onDelete?.(habit)}
        activeOpacity={0.7}
      >
        <Animated.View style={{ transform: [{ scale }] }}>
          <Text style={styles.deleteIcon}>🗑️</Text>
          <Text style={styles.deleteText}>Eliminar</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const cardContent = (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: cardColor }, isInactive && styles.cardInactive]}
      onPress={() => onPress(habit)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Text style={styles.categoryIcon}>{habit.category.icon || '📌'}</Text>
        </View>
        <View style={styles.content}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {habit.name}
            </Text>
            {isInactive && (
              <View style={styles.inactiveBadge}>
                <Text style={styles.inactiveBadgeText}>Inactivo</Text>
              </View>
            )}
          </View>
          <View style={styles.metaRow}>
            <View style={[styles.typeBadge, { backgroundColor: typeColor }]}>
              <Text style={styles.typeBadgeText}>{habit.type === 'CHECK' ? '✓' : '#'}</Text>
            </View>
            <Text style={styles.categoryName} numberOfLines={1}>
              {habit.category.name}
            </Text>
            <Text style={styles.separator}>•</Text>
            <Text style={styles.periodicity}>{PERIODICITY_LABELS[habit.periodicity]}</Text>
          </View>
          {habit.description && (
            <Text style={styles.description} numberOfLines={2}>
              {habit.description}
            </Text>
          )}
        </View>
        <View style={styles.rightSection}>
          <Text style={styles.timeIcon}>{TIME_OF_DAY_ICONS[habit.timeOfDay]}</Text>
          {habit.type === 'NUMERIC' && habit.targetValue && (
            <View style={styles.targetBadge}>
              <Text style={styles.targetText}>
                {habit.targetValue}
                {habit.unit ? ` ${habit.unit}` : ''}
              </Text>
            </View>
          )}
        </View>
      </View>

      {habit.periodicity === 'WEEKLY' && habit.weekDays.length > 0 && (
        <View style={styles.weekDaysContainer}>
          {['D', 'L', 'M', 'X', 'J', 'V', 'S'].map((day, index) => {
            const isActive = habit.weekDays.includes(index);
            return (
              <View
                key={index}
                style={[
                  styles.weekDay,
                  isActive && styles.weekDayActive,
                  { borderColor: cardColor },
                ]}
              >
                <Text style={[styles.weekDayText, isActive && styles.weekDayTextActive]}>
                  {day}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </TouchableOpacity>
  );

  // If no action handlers provided, render card without swipe
  if (!onDelete && !onReactivate) {
    return cardContent;
  }

  // Render with swipe actions (delete for active, reactivate for inactive)
  return (
    <Swipeable renderRightActions={renderRightActions} overshootRight={false}>
      {cardContent}
    </Swipeable>
  );
});

HabitCard.displayName = 'HabitCard';

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardInactive: {
    opacity: 0.6,
    backgroundColor: '#f9f9f9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
  content: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    flexWrap: 'wrap',
    gap: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    flex: 1,
  },
  inactiveBadge: {
    backgroundColor: '#9E9E9E',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  inactiveBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  typeBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  categoryName: {
    fontSize: 13,
    color: '#666',
    maxWidth: 100,
  },
  separator: {
    fontSize: 13,
    color: '#999',
    marginHorizontal: 6,
  },
  periodicity: {
    fontSize: 13,
    color: '#666',
  },
  description: {
    fontSize: 13,
    color: '#757575',
    marginTop: 6,
    lineHeight: 18,
  },
  rightSection: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  timeIcon: {
    fontSize: 18,
    marginBottom: 4,
  },
  targetBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  targetText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1976D2',
  },
  weekDaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  weekDay: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDayActive: {
    borderWidth: 2,
    backgroundColor: '#f5f5f5',
  },
  weekDayText: {
    fontSize: 12,
    color: '#999',
  },
  weekDayTextActive: {
    fontWeight: '600',
    color: '#212121',
  },
  deleteAction: {
    backgroundColor: '#F44336',
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    marginBottom: 12,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  deleteIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  deleteText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  reactivateAction: {
    backgroundColor: '#FF9800',
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    marginBottom: 12,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  reactivateIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  reactivateText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
