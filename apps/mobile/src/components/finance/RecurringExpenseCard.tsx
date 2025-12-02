/**
 * RecurringExpenseCard Component
 * Sprint 10 - US-088
 *
 * Card displaying recurring expense template with category, concept, currency
 * Supports swipe actions: right (edit), left (delete)
 */

import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import type { RecurringExpense } from '../../api/recurringExpenses.api';

interface RecurringExpenseCardProps {
  expense: RecurringExpense;
  onPress: (expense: RecurringExpense) => void;
  onEdit?: (expense: RecurringExpense) => void;
  onDelete?: (expense: RecurringExpense) => void;
}

// Currency badge colors
const CURRENCY_COLORS: Record<string, { bg: string; text: string }> = {
  ARS: { bg: '#E3F2FD', text: '#1976D2' },
  USD: { bg: '#E8F5E9', text: '#388E3C' },
  EUR: { bg: '#F3E5F5', text: '#7B1FA2' },
};

export const RecurringExpenseCard = ({
  expense,
  onPress,
  onEdit,
  onDelete,
}: RecurringExpenseCardProps) => {
  const isInactive = !expense.isActive;
  const currencyStyle = CURRENCY_COLORS[expense.currency] || {
    bg: '#FFF3E0',
    text: '#F57C00',
  };

  // Render left actions (edit - swipe right)
  const renderLeftActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const scale = dragX.interpolate({
      inputRange: [0, 100],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    });

    return (
      <TouchableOpacity
        style={styles.editAction}
        onPress={() => onEdit?.(expense)}
        activeOpacity={0.7}
      >
        <Animated.View style={{ transform: [{ scale }] }}>
          <Text style={styles.editIcon}>✏️</Text>
          <Text style={styles.editText}>Editar</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  // Render right actions (delete - swipe left)
  const renderRightActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    return (
      <TouchableOpacity
        style={styles.deleteAction}
        onPress={() => onDelete?.(expense)}
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
      style={[
        styles.card,
        { borderLeftColor: expense.category?.color || '#9E9E9E' },
        isInactive && styles.cardInactive,
      ]}
      onPress={() => onPress(expense)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        {/* Category Icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.categoryIcon}>{expense.category?.icon || '💰'}</Text>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Concept */}
          <View style={styles.conceptRow}>
            <Text style={styles.concept} numberOfLines={1}>
              {expense.concept}
            </Text>
            {isInactive && (
              <View style={styles.inactiveBadge}>
                <Text style={styles.inactiveBadgeText}>Inactivo</Text>
              </View>
            )}
          </View>

          {/* Category Name */}
          <Text style={styles.categoryName} numberOfLines={1}>
            {expense.category?.name || 'Sin categoría'}
          </Text>
        </View>

        {/* Currency Badge */}
        <View style={[styles.currencyBadge, { backgroundColor: currencyStyle.bg }]}>
          <Text style={[styles.currencyText, { color: currencyStyle.text }]}>
            {expense.currency}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // If no action handlers provided, render card without swipe
  if (!onEdit && !onDelete) {
    return cardContent;
  }

  // Render with swipe actions
  return (
    <Swipeable
      renderLeftActions={onEdit ? renderLeftActions : undefined}
      renderRightActions={onDelete ? renderRightActions : undefined}
      overshootLeft={false}
      overshootRight={false}
    >
      {cardContent}
    </Swipeable>
  );
};

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
    alignItems: 'center',
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
  conceptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
    gap: 8,
  },
  concept: {
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
  categoryName: {
    fontSize: 13,
    color: '#666',
  },
  currencyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8,
  },
  currencyText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  editAction: {
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    marginBottom: 12,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  editIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  editText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
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
});
