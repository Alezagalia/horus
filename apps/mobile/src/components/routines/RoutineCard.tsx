/**
 * RoutineCard Component
 * Sprint 14 - US-133
 *
 * Displays a single routine with name, description, stats, and action button
 */

import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { RoutineWithStats } from '../../api/routines.api';

interface RoutineCardProps {
  routine: RoutineWithStats;
  onPress: (routine: RoutineWithStats) => void;
  onStart: (routine: RoutineWithStats) => void;
  onLongPress?: (routine: RoutineWithStats) => void;
}

export const RoutineCard = ({ routine, onPress, onStart, onLongPress }: RoutineCardProps) => {
  const exerciseCount = routine.exerciseCount || routine.exercises?.length || 0;
  const timesExecuted = routine.timesExecuted || 0;

  const formatLastExecuted = (date: string | null | undefined): string => {
    if (!date) return 'Nunca ejecutada';

    const lastDate = new Date(date);
    const now = new Date();
    const diffTime = now.getTime() - lastDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
    return `Hace ${Math.floor(diffDays / 30)} meses`;
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(routine)}
      onLongPress={() => onLongPress?.(routine)}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name}>{routine.name}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>📋 {exerciseCount}</Text>
          </View>
        </View>

        {routine.description && (
          <Text style={styles.description} numberOfLines={2}>
            {routine.description}
          </Text>
        )}

        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{timesExecuted}</Text>
            <Text style={styles.statLabel}>veces</Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatLastExecuted(routine.lastExecuted)}</Text>
            <Text style={styles.statLabel}>última vez</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.startButton}
        onPress={(e) => {
          e.stopPropagation();
          onStart(routine);
        }}
      >
        <Text style={styles.startButtonText}>Iniciar</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  name: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  badge: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  separator: {
    width: 1,
    height: 30,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 12,
  },
  startButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
