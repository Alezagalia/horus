/**
 * WorkoutDetailScreen
 * Sprint 14 - US-135
 *
 * Pantalla de detalle de un workout completado
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { getWorkoutById } from '../api/workouts.api';

type RootStackParamList = {
  WorkoutDetail: { workoutId: string };
  ExecuteRoutine: { routineId: string };
};

type WorkoutDetailScreenRouteProp = RouteProp<RootStackParamList, 'WorkoutDetail'>;
type WorkoutDetailScreenNavigationProp = StackNavigationProp<RootStackParamList>;

export const WorkoutDetailScreen: React.FC = () => {
  const navigation = useNavigation<WorkoutDetailScreenNavigationProp>();
  const route = useRoute<WorkoutDetailScreenRouteProp>();

  const { workoutId } = route.params;

  // Fetch workout detail
  const {
    data: workout,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['workout', workoutId],
    queryFn: () => getWorkoutById(workoutId),
  });

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
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

  const handleRepeatRoutine = () => {
    if (!workout?.routineId) {
      Alert.alert('Error', 'Este workout no tiene una rutina asociada');
      return;
    }

    Alert.alert(
      'Repetir Rutina',
      `¿Quieres iniciar un nuevo workout con la rutina "${workout.routineName}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Iniciar',
          onPress: () => {
            navigation.navigate('ExecuteRoutine', { routineId: workout.routineId! });
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Cargando detalle...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !workout) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Error al cargar</Text>
          <Text style={styles.errorText}>No se pudo cargar el detalle del entrenamiento</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.date}>{formatDate(workout.startTime)}</Text>
          <Text style={styles.time}>{formatTime(workout.startTime)}</Text>
          {workout.routineName && <Text style={styles.routineName}>{workout.routineName}</Text>}
          {!workout.routineName && <Text style={styles.routineNameEmpty}>Workout sin rutina</Text>}
          <View style={styles.durationContainer}>
            <Text style={styles.durationLabel}>Duración:</Text>
            <Text style={styles.durationValue}>{formatDuration(workout.duration)}</Text>
          </View>
        </View>

        {/* General Notes */}
        {workout.notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesTitle}>Notas generales</Text>
            <Text style={styles.notesText}>{workout.notes}</Text>
          </View>
        )}

        {/* Summary */}
        {workout.summary && (
          <View style={styles.summaryContainer}>
            <Text style={styles.sectionTitle}>Resumen</Text>
            <View style={styles.summaryStats}>
              <View style={styles.summaryStatItem}>
                <Text style={styles.summaryStatValue}>{workout.summary.totalSets}</Text>
                <Text style={styles.summaryStatLabel}>
                  {workout.summary.totalSets === 1 ? 'Serie' : 'Series'}
                </Text>
              </View>
              <View style={styles.summaryStatItem}>
                <Text style={styles.summaryStatValue}>{workout.summary.totalReps}</Text>
                <Text style={styles.summaryStatLabel}>Reps</Text>
              </View>
              <View style={styles.summaryStatItem}>
                <Text style={styles.summaryStatValue}>
                  {formatVolume(workout.summary.totalVolume)}
                </Text>
                <Text style={styles.summaryStatLabel}>Volumen</Text>
              </View>
              <View style={styles.summaryStatItem}>
                <Text style={styles.summaryStatValue}>
                  {Math.round(workout.summary.avgWeight)} kg
                </Text>
                <Text style={styles.summaryStatLabel}>Peso Prom.</Text>
              </View>
            </View>

            {/* Personal Records */}
            {workout.summary.personalRecords.length > 0 && (
              <View style={styles.prContainer}>
                <Text style={styles.prTitle}>🎉 Nuevos récords personales</Text>
                {workout.summary.personalRecords.map((pr) => (
                  <View key={pr.exerciseId} style={styles.prItem}>
                    <Text style={styles.prExercise}>{pr.exerciseName}</Text>
                    <Text style={styles.prValue}>
                      {pr.newPR} kg (+{pr.improvement} kg)
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Exercises */}
        <View style={styles.exercisesContainer}>
          <Text style={styles.sectionTitle}>Ejercicios</Text>
          {workout.exercises.map((exercise, index) => (
            <View key={exercise.id} style={styles.exerciseCard}>
              <View style={styles.exerciseHeader}>
                <Text style={styles.exerciseNumber}>Ejercicio {index + 1}</Text>
                {exercise.rpe && (
                  <View style={styles.rpeContainer}>
                    <Text style={styles.rpeLabel}>RPE:</Text>
                    <Text style={styles.rpeValue}>{exercise.rpe}/10</Text>
                  </View>
                )}
              </View>
              <Text style={styles.exerciseName}>{exercise.exerciseName}</Text>
              {exercise.muscleGroup && (
                <Text style={styles.muscleGroup}>{exercise.muscleGroup}</Text>
              )}

              {/* Exercise Notes */}
              {exercise.notes && (
                <View style={styles.exerciseNotes}>
                  <Text style={styles.exerciseNotesText}>{exercise.notes}</Text>
                </View>
              )}

              {/* Sets */}
              <View style={styles.setsContainer}>
                <Text style={styles.setsTitle}>Series ({exercise.sets.length})</Text>
                {exercise.sets.map((set) => (
                  <View key={set.setNumber} style={styles.setRow}>
                    <Text style={styles.setNumber}>Serie {set.setNumber}</Text>
                    <Text style={styles.setValue}>
                      {set.reps} reps × {set.weight} {set.weightUnit}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>

        {/* Repeat Routine Button */}
        {workout.routineId && (
          <View style={styles.actionContainer}>
            <TouchableOpacity style={styles.repeatButton} onPress={handleRepeatRoutine}>
              <Text style={styles.repeatButtonText}>🔄 Repetir Rutina</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  date: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  time: {
    fontSize: 14,
    color: '#999',
    marginBottom: 12,
  },
  routineName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  routineNameEmpty: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#999',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  durationLabel: {
    fontSize: 14,
    color: '#666',
  },
  durationValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  notesContainer: {
    backgroundColor: '#FFF3E0',
    padding: 16,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E65100',
    marginBottom: 8,
  },
  notesText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  summaryContainer: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  summaryStatItem: {
    alignItems: 'center',
  },
  summaryStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  summaryStatLabel: {
    fontSize: 12,
    color: '#666',
  },
  prContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  prTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  prItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  prExercise: {
    fontSize: 14,
    color: '#333',
  },
  prValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#34C759',
  },
  exercisesContainer: {
    marginTop: 16,
    marginHorizontal: 16,
  },
  exerciseCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  exerciseNumber: {
    fontSize: 12,
    color: '#999',
    textTransform: 'uppercase',
  },
  rpeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  rpeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  rpeValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  muscleGroup: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  exerciseNotes: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  exerciseNotesText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  setsContainer: {
    marginTop: 8,
  },
  setsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  setRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    marginBottom: 6,
  },
  setNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  setValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  actionContainer: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  repeatButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  repeatButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  bottomPadding: {
    height: 32,
  },
});
