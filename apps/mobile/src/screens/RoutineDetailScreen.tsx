/**
 * RoutineDetailScreen - Routine Detail View
 * Sprint 14 - US-133
 *
 * Detailed view of a routine with exercises and history
 */

import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRoutineById, deleteRoutine } from '../api/routines.api';
import { Toast } from '../components/common/Toast';

interface RoutineDetailScreenProps {
  routineId: string;
  // TODO: Add navigation when implemented
  // navigation: any;
}

export function RoutineDetailScreen({ routineId }: RoutineDetailScreenProps) {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const queryClient = useQueryClient();

  // Fetch routine detail
  const {
    data: routine,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['routine', routineId],
    queryFn: () => getRoutineById(routineId),
    enabled: !!routineId,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteRoutine,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines'] });
      setToast({ message: 'Rutina eliminada', type: 'success' });
      // TODO: Navigate back
      // navigation.goBack();
    },
    onError: (error: Error) => {
      const axiosError = error as { response?: { data?: { message?: string } } };
      setToast({
        message: axiosError.response?.data?.message || 'Error al eliminar rutina',
        type: 'error',
      });
    },
  });

  const handleStartRoutine = () => {
    if (!routine) return;
    // TODO: Navigate to execute routine screen
    // navigation.navigate('ExecuteRoutine', { routineId: routine.id });
    console.log('Start routine:', routine.id);
    setToast({ message: `Iniciando "${routine.name}"...`, type: 'success' });
  };

  const handleEdit = () => {
    if (!routine) return;
    // TODO: Navigate to edit screen
    // navigation.navigate('RoutineForm', { routineId: routine.id });
    console.log('Edit routine:', routine.id);
  };

  const handleDelete = () => {
    if (!routine) return;

    Alert.alert('Eliminar Rutina', `¿Estás seguro de eliminar "${routine.name}"?`, [
      {
        text: 'Cancelar',
        style: 'cancel',
      },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => deleteMutation.mutate(routine.id),
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Cargando rutina...</Text>
      </View>
    );
  }

  if (error || !routine) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>❌</Text>
        <Text style={styles.errorTitle}>Error al cargar rutina</Text>
        <Text style={styles.errorMessage}>
          {error instanceof Error ? error.message : 'Rutina no encontrada'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name}>{routine.name}</Text>
          {routine.description && <Text style={styles.description}>{routine.description}</Text>}
        </View>

        {/* Start Button */}
        <TouchableOpacity style={styles.startButton} onPress={handleStartRoutine}>
          <Text style={styles.startButtonIcon}>▶️</Text>
          <Text style={styles.startButtonText}>Iniciar Rutina</Text>
        </TouchableOpacity>

        {/* Exercises List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ejercicios ({routine.exercises?.length || 0})</Text>

          {routine.exercises && routine.exercises.length > 0 ? (
            routine.exercises.map((exercise, index) => (
              <View key={exercise.id} style={styles.exerciseCard}>
                <View style={styles.exerciseHeader}>
                  <Text style={styles.exerciseOrder}>{index + 1}</Text>
                  <Text style={styles.exerciseName}>{exercise.exercise.name}</Text>
                </View>

                <View style={styles.exerciseDetails}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Target:</Text>
                    <Text style={styles.detailValue}>
                      {exercise.targetSets} × {exercise.targetReps}
                      {exercise.targetWeight && ` @ ${exercise.targetWeight}kg`}
                    </Text>
                  </View>
                  {exercise.restTime && (
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Descanso:</Text>
                      <Text style={styles.detailValue}>{exercise.restTime}s</Text>
                    </View>
                  )}
                </View>

                {exercise.notes && <Text style={styles.exerciseNotes}>📝 {exercise.notes}</Text>}
              </View>
            ))
          ) : (
            <View style={styles.emptyExercises}>
              <Text style={styles.emptyText}>No hay ejercicios en esta rutina</Text>
            </View>
          )}
        </View>

        {/* History Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Historial Reciente</Text>
          <View style={styles.historyPlaceholder}>
            <Text style={styles.placeholderText}>📊 Historial próximamente</Text>
            <Text style={styles.placeholderSubtext}>
              Verás las últimas 5 ejecuciones de esta rutina
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
            <Text style={styles.actionButtonText}>✏️ Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDelete}
          >
            <Text style={[styles.actionButtonText, styles.deleteButtonText]}>🗑️ Eliminar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          visible={!!toast}
          onHide={() => setToast(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  name: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  startButton: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  startButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  exerciseCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  exerciseOrder: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2196F3',
    marginRight: 12,
    width: 30,
  },
  exerciseName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  exerciseDetails: {
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
    minWidth: 70,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  exerciseNotes: {
    fontSize: 13,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  emptyExercises: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
  historyPlaceholder: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  placeholderSubtext: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  deleteButton: {
    borderColor: '#f44336',
  },
  deleteButtonText: {
    color: '#f44336',
  },
});
