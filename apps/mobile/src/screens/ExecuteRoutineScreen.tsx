/**
 * ExecuteRoutineScreen
 * Sprint 14 - US-134
 *
 * PANTALLA CRÍTICA: Ejecución de rutina con tracking de series y progreso
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  SafeAreaView,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import {
  startWorkout,
  addSet,
  finishWorkout,
  cancelWorkout,
  StartWorkoutResponse,
} from '../api/workouts.api';
import { AddSetModal } from '../components/workouts/AddSetModal';

type RootStackParamList = {
  ExecuteRoutine: { routineId: string };
  WorkoutSummary: { workoutId: string };
};

type ExecuteRoutineScreenRouteProp = RouteProp<RootStackParamList, 'ExecuteRoutine'>;
type ExecuteRoutineScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface ExerciseState {
  exerciseId: string;
  routineExerciseId: string;
  completed: boolean;
  sets: Array<{ reps: number; weight: number }>;
}

export const ExecuteRoutineScreen: React.FC = () => {
  const navigation = useNavigation<ExecuteRoutineScreenNavigationProp>();
  const route = useRoute<ExecuteRoutineScreenRouteProp>();
  const queryClient = useQueryClient();

  const { routineId } = route.params;

  const [workoutData, setWorkoutData] = useState<StartWorkoutResponse | null>(null);
  const [exercisesState, setExercisesState] = useState<Record<string, ExerciseState>>({});
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState<number>(0);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [workoutStartTime] = useState<Date>(new Date());

  // Start workout
  const { isLoading: isStarting } = useQuery({
    queryKey: ['startWorkout', routineId],
    queryFn: () => startWorkout(routineId),
    onSuccess: (data) => {
      setWorkoutData(data);
      // Initialize exercises state
      const initialState: Record<string, ExerciseState> = {};
      data.routine.exercises.forEach((ex) => {
        initialState[ex.id] = {
          exerciseId: ex.exerciseId,
          routineExerciseId: ex.id,
          completed: false,
          sets: [],
        };
      });
      setExercisesState(initialState);
    },
    onError: (error: any) => {
      Alert.alert('Error', 'No se pudo iniciar el workout');
      navigation.goBack();
    },
  });

  // Add set mutation
  const addSetMutation = useMutation({
    mutationFn: ({
      exerciseId,
      reps,
      weight,
    }: {
      exerciseId: string;
      reps: number;
      weight: number;
    }) => addSet(workoutData?.workoutId || '', exerciseId, { reps, weight }),
    onSuccess: (_, { exerciseId, reps, weight }) => {
      // Update local state
      setExercisesState((prev) => {
        const exerciseKey = Object.keys(prev).find((key) => prev[key].exerciseId === exerciseId);
        if (!exerciseKey) return prev;

        return {
          ...prev,
          [exerciseKey]: {
            ...prev[exerciseKey],
            sets: [...prev[exerciseKey].sets, { reps, weight }],
          },
        };
      });
    },
    onError: () => {
      Alert.alert('Error', 'No se pudo guardar la serie');
    },
  });

  // Finish workout mutation
  const finishMutation = useMutation({
    mutationFn: () => finishWorkout(workoutData?.workoutId || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      Alert.alert('¡Excelente!', 'Workout completado exitosamente', [
        {
          text: 'Ver Resumen',
          onPress: () => {
            navigation.replace('WorkoutSummary', { workoutId: workoutData?.workoutId || '' });
          },
        },
      ]);
    },
    onError: () => {
      Alert.alert('Error', 'No se pudo finalizar el workout');
    },
  });

  // Cancel workout mutation
  const cancelMutation = useMutation({
    mutationFn: () => cancelWorkout(workoutData?.workoutId || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      navigation.goBack();
    },
  });

  const handleAddSet = (reps: number, weight: number) => {
    if (!workoutData) return;

    const currentExercise = workoutData.routine.exercises[currentExerciseIndex];
    const exerciseState = exercisesState[currentExercise.id];

    addSetMutation.mutate({
      exerciseId: exerciseState.exerciseId,
      reps,
      weight,
    });

    setModalVisible(false);
  };

  const handleCompleteExercise = () => {
    const currentExercise = workoutData?.routine.exercises[currentExerciseIndex];
    if (!currentExercise) return;

    const exerciseState = exercisesState[currentExercise.id];
    if (exerciseState.sets.length === 0) {
      Alert.alert('Sin series', 'Debes registrar al menos una serie para completar el ejercicio');
      return;
    }

    setExercisesState((prev) => ({
      ...prev,
      [currentExercise.id]: {
        ...prev[currentExercise.id],
        completed: true,
      },
    }));

    // Move to next exercise
    if (currentExerciseIndex < (workoutData?.routine.exercises.length || 0) - 1) {
      setCurrentExerciseIndex((prev) => prev + 1);
    }
  };

  const handleFinishWorkout = () => {
    const totalSets = Object.values(exercisesState).reduce((sum, ex) => sum + ex.sets.length, 0);

    if (totalSets === 0) {
      Alert.alert('Workout vacío', 'Debes registrar al menos una serie antes de finalizar');
      return;
    }

    Alert.alert('Finalizar Workout', '¿Estás seguro de que quieres finalizar el workout?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Finalizar',
        style: 'default',
        onPress: () => finishMutation.mutate(),
      },
    ]);
  };

  const handleCancelWorkout = () => {
    Alert.alert('Cancelar Workout', 'Se perderá todo el progreso. ¿Estás seguro?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Sí, cancelar',
        style: 'destructive',
        onPress: () => cancelMutation.mutate(),
      },
    ]);
  };

  const getLastSetData = (exerciseId: string): { reps?: number; weight?: number } => {
    const history = workoutData?.history.find((h) => h.exerciseId === exerciseId);
    if (!history || history.sets.length === 0) return {};

    const lastSet = history.sets[history.sets.length - 1];
    return { reps: lastSet.reps, weight: lastSet.weight };
  };

  const calculateWorkoutDuration = (): string => {
    const now = new Date();
    const diffMs = now.getTime() - workoutStartTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    return `${diffMins} min`;
  };

  const calculateProgress = (): number => {
    if (!workoutData) return 0;
    const completedCount = Object.values(exercisesState).filter((ex) => ex.completed).length;
    return (completedCount / workoutData.routine.exercises.length) * 100;
  };

  if (isStarting || !workoutData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Iniciando workout...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentExercise = workoutData.routine.exercises[currentExerciseIndex];
  const currentExerciseState = exercisesState[currentExercise.id];
  const lastSetData = getLastSetData(currentExerciseState.exerciseId);
  const progress = calculateProgress();
  const allExercisesCompleted =
    Object.values(exercisesState).filter((ex) => ex.completed).length ===
    workoutData.routine.exercises.length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={handleCancelWorkout}>
            <Text style={styles.cancelButton}>✕ Cancelar</Text>
          </TouchableOpacity>
          <Text style={styles.duration}>{calculateWorkoutDuration()}</Text>
        </View>
        <Text style={styles.routineName}>{workoutData.routine.name}</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {currentExerciseIndex + 1} / {workoutData.routine.exercises.length} ejercicios
        </Text>
      </View>

      {/* Current Exercise */}
      <ScrollView style={styles.content}>
        <View style={styles.exerciseContainer}>
          <Text style={styles.exerciseNumber}>Ejercicio {currentExerciseIndex + 1}</Text>
          <Text style={styles.exerciseName}>{currentExercise.exercise.name}</Text>
          {currentExercise.exercise.muscleGroup && (
            <Text style={styles.muscleGroup}>{currentExercise.exercise.muscleGroup}</Text>
          )}

          {/* Target info */}
          {currentExercise.targetSets && (
            <View style={styles.targetContainer}>
              <Text style={styles.targetLabel}>Target:</Text>
              <Text style={styles.targetValue}>
                {currentExercise.targetSets} × {currentExercise.targetReps}
                {currentExercise.targetWeight && ` @ ${currentExercise.targetWeight}kg`}
              </Text>
            </View>
          )}

          {/* Sets registered */}
          <View style={styles.setsContainer}>
            <Text style={styles.setsTitle}>
              Series registradas ({currentExerciseState.sets.length})
            </Text>
            {currentExerciseState.sets.map((set, index) => (
              <View key={index} style={styles.setRow}>
                <Text style={styles.setNumber}>Serie {index + 1}</Text>
                <Text style={styles.setValue}>
                  {set.reps} reps × {set.weight}kg
                </Text>
              </View>
            ))}
            {currentExerciseState.sets.length === 0 && (
              <Text style={styles.noSetsText}>Sin series aún</Text>
            )}
          </View>

          {/* Add set button */}
          {!currentExerciseState.completed && (
            <TouchableOpacity style={styles.addSetButton} onPress={() => setModalVisible(true)}>
              <Text style={styles.addSetButtonText}>+ Agregar Serie</Text>
            </TouchableOpacity>
          )}

          {/* Complete exercise button */}
          {!currentExerciseState.completed && currentExerciseState.sets.length > 0 && (
            <TouchableOpacity
              style={styles.completeExerciseButton}
              onPress={handleCompleteExercise}
            >
              <Text style={styles.completeExerciseButtonText}>✓ Completar Ejercicio</Text>
            </TouchableOpacity>
          )}

          {currentExerciseState.completed && (
            <View style={styles.completedBadge}>
              <Text style={styles.completedText}>✓ Completado</Text>
            </View>
          )}
        </View>

        {/* Exercise navigation */}
        <View style={styles.navigationContainer}>
          <TouchableOpacity
            style={[styles.navButton, currentExerciseIndex === 0 && styles.navButtonDisabled]}
            onPress={() => setCurrentExerciseIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentExerciseIndex === 0}
          >
            <Text style={styles.navButtonText}>← Anterior</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.navButton,
              currentExerciseIndex >= workoutData.routine.exercises.length - 1 &&
                styles.navButtonDisabled,
            ]}
            onPress={() =>
              setCurrentExerciseIndex((prev) =>
                Math.min(workoutData.routine.exercises.length - 1, prev + 1)
              )
            }
            disabled={currentExerciseIndex >= workoutData.routine.exercises.length - 1}
          >
            <Text style={styles.navButtonText}>Siguiente →</Text>
          </TouchableOpacity>
        </View>

        {/* All exercises list */}
        <View style={styles.allExercisesContainer}>
          <Text style={styles.allExercisesTitle}>Todos los ejercicios</Text>
          {workoutData.routine.exercises.map((ex, index) => {
            const state = exercisesState[ex.id];
            return (
              <TouchableOpacity
                key={ex.id}
                style={[
                  styles.exerciseListItem,
                  index === currentExerciseIndex && styles.exerciseListItemActive,
                  state.completed && styles.exerciseListItemCompleted,
                ]}
                onPress={() => setCurrentExerciseIndex(index)}
              >
                <View style={styles.exerciseListItemLeft}>
                  <Text style={styles.exerciseListItemNumber}>{index + 1}</Text>
                  <Text style={styles.exerciseListItemName}>{ex.exercise.name}</Text>
                </View>
                <Text style={styles.exerciseListItemSets}>
                  {state.sets.length} {state.sets.length === 1 ? 'serie' : 'series'}
                  {state.completed && ' ✓'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Footer - Finish button */}
      {allExercisesCompleted && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.finishButton}
            onPress={handleFinishWorkout}
            disabled={finishMutation.isPending}
          >
            <Text style={styles.finishButtonText}>
              {finishMutation.isPending ? 'Finalizando...' : '🎉 Finalizar Workout'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Add set modal */}
      <AddSetModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleAddSet}
        setNumber={currentExerciseState.sets.length + 1}
        lastReps={lastSetData.reps}
        lastWeight={lastSetData.weight}
        restTime={currentExercise.restTime || 60}
        exerciseName={currentExercise.exercise.name}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cancelButton: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '600',
  },
  duration: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  routineName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#34C759',
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  exerciseContainer: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
  },
  exerciseNumber: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
  exerciseName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  muscleGroup: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  targetContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    marginBottom: 20,
  },
  targetLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0066CC',
    marginRight: 8,
  },
  targetValue: {
    fontSize: 14,
    color: '#0066CC',
  },
  setsContainer: {
    marginBottom: 20,
  },
  setsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  setRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 8,
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
  noSetsText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  addSetButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  addSetButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  completeExerciseButton: {
    backgroundColor: '#34C759',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  completeExerciseButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  completedBadge: {
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  completedText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  navButton: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  allExercisesContainer: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  allExercisesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  exerciseListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
  },
  exerciseListItemActive: {
    backgroundColor: '#E3F2FD',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  exerciseListItemCompleted: {
    backgroundColor: '#E8F5E9',
  },
  exerciseListItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  exerciseListItemNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginRight: 12,
    width: 20,
  },
  exerciseListItemName: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  exerciseListItemSets: {
    fontSize: 12,
    color: '#666',
  },
  footer: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  finishButton: {
    backgroundColor: '#34C759',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  finishButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
});
