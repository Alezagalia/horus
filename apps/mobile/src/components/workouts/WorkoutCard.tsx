/**
 * WorkoutCard Component
 * Sprint 14 - US-135
 *
 * Card para mostrar workouts completados en el historial
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { WorkoutListItem } from '@horus/shared';

interface WorkoutCardProps {
  workout: WorkoutListItem;
  onPress: () => void;
}

export const WorkoutCard: React.FC<WorkoutCardProps> = ({ workout, onPress }) => {
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;

    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const formatDuration = (minutes: number | null): string => {
    if (!minutes) return 'Sin duración';
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatVolume = (volume: number): string => {
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}k kg`;
    }
    return `${Math.round(volume)} kg`;
  };

  const getDurationBadgeStyle = (minutes: number | null) => {
    if (!minutes) return styles.badgeGray;
    if (minutes >= 60) return styles.badgeGreen;
    if (minutes >= 30) return styles.badgeYellow;
    return styles.badgeGray;
  };

  const duration = workout.duration;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.date}>{formatDate(workout.startTime)}</Text>
          <View style={[styles.durationBadge, getDurationBadgeStyle(duration)]}>
            <Text style={styles.durationText}>{formatDuration(duration)}</Text>
          </View>
        </View>
        <Text style={styles.time}>
          {new Date(workout.startTime).toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>

      {/* Routine Name */}
      {workout.routineName && <Text style={styles.routineName}>{workout.routineName}</Text>}
      {!workout.routineName && <Text style={styles.routineNameEmpty}>Workout sin rutina</Text>}

      {/* Stats */}
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{workout.exercisesCompleted}</Text>
          <Text style={styles.statLabel}>
            {workout.exercisesCompleted === 1 ? 'ejercicio' : 'ejercicios'}
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{workout.totalSets}</Text>
          <Text style={styles.statLabel}>{workout.totalSets === 1 ? 'serie' : 'series'}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatVolume(workout.totalVolume)}</Text>
          <Text style={styles.statLabel}>volumen</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  date: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  time: {
    fontSize: 14,
    color: '#999',
  },
  durationBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeGreen: {
    backgroundColor: '#E8F5E9',
  },
  badgeYellow: {
    backgroundColor: '#FFF3E0',
  },
  badgeGray: {
    backgroundColor: '#F5F5F5',
  },
  durationText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  routineName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  routineNameEmpty: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#999',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E0E0E0',
  },
});
