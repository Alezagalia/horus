/**
 * TaskCard Component
 * Sprint 7 - US-061
 * Sprint 12 - US-108: Optimized with React.memo for performance
 *
 * Componente de tarjeta de tarea con:
 * - Color de fondo según sistema semáforo
 * - Badge de prioridad
 * - Fecha de vencimiento
 * - Progreso de checklist
 * - Checkbox para toggle rápido
 */

import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Task } from '../api/tasks.api';
import { calcularColorTarea, formatDueDate, getTaskUrgencyText } from '../utils/taskColors';

interface TaskCardProps {
  task: Task;
  onPress: () => void;
  onToggle: (taskId: string) => void;
  isToggling?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = memo(({ task, onPress, onToggle, isToggling }) => {
  const colors = calcularColorTarea(task);
  const dueDateText = formatDueDate(task.dueDate);
  const urgencyText = getTaskUrgencyText(task);

  const handleToggle = (e: any) => {
    e.stopPropagation(); // Prevenir que abra el detalle
    onToggle(task.id);
  };

  const getPriorityIcon = () => {
    if (task.priority !== 'alta') return null;
    return (
      <View style={styles.priorityBadge}>
        <Ionicons name="warning" size={14} color="#8B0000" />
        <Text style={styles.priorityText}>Alta</Text>
      </View>
    );
  };

  const getChecklistProgress = () => {
    if (!task.checklistSummary || task.checklistSummary.total === 0) return null;

    const { completed, total } = task.checklistSummary;
    const percentage = (completed / total) * 100;

    return (
      <View style={styles.checklistContainer}>
        <Ionicons name="list" size={14} color="#666" />
        <Text style={styles.checklistText}>
          {completed}/{total} completados
        </Text>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${percentage}%` }]} />
        </View>
      </View>
    );
  };

  const getCheckboxIcon = () => {
    if (task.status === 'completada') {
      return 'checkmark-circle';
    } else if (task.status === 'cancelada') {
      return 'close-circle';
    } else {
      return 'ellipse-outline';
    }
  };

  const getCheckboxColor = () => {
    if (task.status === 'completada') return '#4CAF50';
    if (task.status === 'cancelada') return '#999';
    return '#666';
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: colors.backgroundColor, borderColor: colors.borderColor },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Left Section: Checkbox */}
      <TouchableOpacity
        style={styles.checkboxContainer}
        onPress={handleToggle}
        disabled={isToggling || task.status === 'cancelada'}
      >
        {isToggling ? (
          <ActivityIndicator size="small" color={getCheckboxColor()} />
        ) : (
          <Ionicons name={getCheckboxIcon()} size={28} color={getCheckboxColor()} />
        )}
      </TouchableOpacity>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Header Row */}
        <View style={styles.headerRow}>
          {/* Category Indicator */}
          {task.category.color && (
            <View style={[styles.categoryDot, { backgroundColor: task.category.color }]} />
          )}

          {/* Title */}
          <Text
            style={[
              styles.title,
              { color: colors.textColor },
              task.status === 'completada' && styles.titleCompleted,
            ]}
            numberOfLines={2}
          >
            {task.title}
          </Text>

          {/* Priority Badge */}
          {getPriorityIcon()}
        </View>

        {/* Metadata Row */}
        <View style={styles.metadataRow}>
          {/* Category Name */}
          <View style={styles.categoryChip}>
            <Text style={styles.categoryName}>{task.category.name}</Text>
          </View>

          {/* Due Date */}
          {dueDateText && (
            <View style={styles.dueDateContainer}>
              <Ionicons name="calendar-outline" size={12} color={colors.textColor} />
              <Text style={[styles.dueDateText, { color: colors.textColor }]}>{dueDateText}</Text>
            </View>
          )}
        </View>

        {/* Urgency Text */}
        {urgencyText && (
          <View style={styles.urgencyContainer}>
            <Ionicons name="alert-circle" size={12} color={colors.textColor} />
            <Text style={[styles.urgencyText, { color: colors.textColor }]}>{urgencyText}</Text>
          </View>
        )}

        {/* Checklist Progress */}
        {getChecklistProgress()}
      </View>
    </TouchableOpacity>
  );
});

TaskCard.displayName = 'TaskCard';

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  checkboxContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    paddingRight: 8,
  },
  content: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
    marginTop: 6,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE6E6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 6,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8B0000',
    marginLeft: 2,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryChip: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginRight: 8,
  },
  categoryName: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dueDateText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  urgencyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  urgencyText: {
    fontSize: 11,
    marginLeft: 4,
    fontWeight: '600',
  },
  checklistContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  checklistText: {
    fontSize: 11,
    color: '#666',
    marginLeft: 4,
    marginRight: 8,
  },
  progressBarContainer: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
});
