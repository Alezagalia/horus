/**
 * ExerciseCard Component
 * Sprint 14 - US-132
 *
 * Displays a single exercise with icon, name, muscle group, and usage count
 * Includes swipe actions for edit and delete
 */

import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { ExerciseWithUsage } from '../../api/exercises.api';

interface ExerciseCardProps {
  exercise: ExerciseWithUsage;
  onPress: (exercise: ExerciseWithUsage) => void;
  onEdit?: (exercise: ExerciseWithUsage) => void;
  onDelete?: (exercise: ExerciseWithUsage) => void;
}

const MUSCLE_GROUP_ICONS: Record<string, string> = {
  PECHO: '💪',
  ESPALDA: '🦅',
  PIERNAS: '🦵',
  HOMBROS: '⚡',
  BRAZOS: '💪',
  ABDOMEN: '🔥',
  CARDIO: '❤️',
  OTRO: '🏋️',
};

const MUSCLE_GROUP_COLORS: Record<string, string> = {
  PECHO: '#E91E63',
  ESPALDA: '#3F51B5',
  PIERNAS: '#4CAF50',
  HOMBROS: '#FF9800',
  BRAZOS: '#9C27B0',
  ABDOMEN: '#F44336',
  CARDIO: '#00BCD4',
  OTRO: '#607D8B',
};

export const ExerciseCard = ({ exercise, onPress }: ExerciseCardProps) => {
  const muscleGroup = exercise.muscleGroup || 'OTRO';
  const icon = MUSCLE_GROUP_ICONS[muscleGroup] || '🏋️';
  const color = MUSCLE_GROUP_COLORS[muscleGroup] || '#607D8B';

  return (
    <TouchableOpacity
      style={[styles.container, { borderLeftColor: color }]}
      onPress={() => onPress(exercise)}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <Text style={styles.icon}>{icon}</Text>
        <View style={styles.info}>
          <Text style={styles.name}>{exercise.name}</Text>
          <View style={styles.metadata}>
            <Text style={styles.muscleGroup}>{muscleGroup}</Text>
            {exercise.usedInRoutines !== undefined && exercise.usedInRoutines > 0 && (
              <>
                <Text style={styles.separator}>•</Text>
                <Text style={styles.usage}>
                  Usado en {exercise.usedInRoutines} rutina
                  {exercise.usedInRoutines !== 1 ? 's' : ''}
                </Text>
              </>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 32,
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  muscleGroup: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  separator: {
    fontSize: 13,
    color: '#999',
    marginHorizontal: 6,
  },
  usage: {
    fontSize: 12,
    color: '#999',
  },
});
