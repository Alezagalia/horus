/**
 * ExercisesScreen - Exercise Management
 * Sprint 14 - US-132
 *
 * Main screen for exercise management with filters and search
 */

import { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MuscleGroup, type CreateExerciseDTO } from '@horus/shared';
import {
  getExercises,
  createExercise,
  updateExercise,
  deleteExercise,
  type ExerciseWithUsage,
} from '../api/exercises.api';
import { ExerciseCard } from '../components/exercises/ExerciseCard';
import { ExerciseFormModal } from '../components/exercises/ExerciseFormModal';
import { EmptyState } from '../components/common/EmptyState';
import { Toast } from '../components/common/Toast';

export function ExercisesScreen() {
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | MuscleGroup>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [exerciseToEdit, setExerciseToEdit] = useState<ExerciseWithUsage | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const queryClient = useQueryClient();

  // React Query for data fetching
  const {
    data: exercises = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['exercises'],
    queryFn: () => getExercises(),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: createExercise,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      setFormModalVisible(false);
      setToast({ message: 'Ejercicio creado', type: 'success' });
    },
    onError: (error: Error) => {
      const axiosError = error as { response?: { data?: { message?: string } } };
      setToast({
        message: axiosError.response?.data?.message || 'Error al crear ejercicio',
        type: 'error',
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateExerciseDTO }) => updateExercise(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      setFormModalVisible(false);
      setExerciseToEdit(null);
      setToast({ message: 'Ejercicio actualizado', type: 'success' });
    },
    onError: (error: Error) => {
      const axiosError = error as { response?: { data?: { message?: string } } };
      setToast({
        message: axiosError.response?.data?.message || 'Error al actualizar ejercicio',
        type: 'error',
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteExercise,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      setToast({ message: 'Ejercicio eliminado', type: 'success' });
    },
    onError: (error: Error) => {
      const axiosError = error as { response?: { data?: { message?: string } } };
      setToast({
        message: axiosError.response?.data?.message || 'Error al eliminar ejercicio',
        type: 'error',
      });
    },
  });

  // Filter and search exercises
  const filteredExercises = exercises.filter((exercise) => {
    const matchesFilter = selectedFilter === 'ALL' || exercise.muscleGroup === selectedFilter;
    const matchesSearch = exercise.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleExercisePress = (exercise: ExerciseWithUsage) => {
    setExerciseToEdit(exercise);
    setFormModalVisible(true);
  };

  const handleCreateNew = () => {
    setExerciseToEdit(null);
    setFormModalVisible(true);
  };

  const handleFormSubmit = (data: CreateExerciseDTO & { id?: string }) => {
    if (data.id) {
      // Edit mode
      const { id, ...updateData } = data;
      updateMutation.mutate({ id, data: updateData });
    } else {
      // Create mode
      createMutation.mutate(data);
    }
  };

  const handleFormClose = () => {
    setFormModalVisible(false);
    setExerciseToEdit(null);
  };

  const handleDelete = (exercise: ExerciseWithUsage) => {
    const usageCount = exercise.usedInRoutines || 0;
    const message =
      usageCount > 0
        ? `Este ejercicio está siendo usado en ${usageCount} rutina${usageCount !== 1 ? 's' : ''}. ¿Estás seguro de eliminarlo?`
        : '¿Estás seguro de eliminar este ejercicio?';

    Alert.alert('Confirmar eliminación', message, [
      {
        text: 'Cancelar',
        style: 'cancel',
      },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => deleteMutation.mutate(exercise.id),
      },
    ]);
  };

  const renderExercise = ({ item }: { item: ExerciseWithUsage }) => (
    <ExerciseCard
      exercise={item}
      onPress={handleExercisePress}
      onEdit={handleExercisePress}
      onDelete={handleDelete}
    />
  );

  const renderEmptyState = () => {
    if (searchQuery) {
      return (
        <EmptyState
          icon="🔍"
          title="No se encontraron ejercicios"
          description={`No hay ejercicios que coincidan con "${searchQuery}"`}
        />
      );
    }

    if (selectedFilter !== 'ALL') {
      return (
        <EmptyState
          icon="💪"
          title={`No tienes ejercicios de ${selectedFilter}`}
          description="Crea tu primer ejercicio para este grupo muscular"
          actionLabel="Crear ejercicio"
          onAction={handleCreateNew}
        />
      );
    }

    return (
      <EmptyState
        icon="🏋️"
        title="No tienes ejercicios"
        description="Crea tu primer ejercicio para empezar a entrenar"
        actionLabel="Crear ejercicio"
        onAction={handleCreateNew}
      />
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Cargando ejercicios...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar ejercicios..."
          placeholderTextColor="#999"
        />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[
            { value: 'ALL', label: 'Todos' },
            ...Object.values(MuscleGroup).map((mg) => ({ value: mg, label: mg })),
          ]}
          keyExtractor={(item) => item.value}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterChip, selectedFilter === item.value && styles.filterChipActive]}
              onPress={() => setSelectedFilter(item.value as 'ALL' | MuscleGroup)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedFilter === item.value && styles.filterChipTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.filterList}
        />
      </View>

      {/* Exercise List */}
      <FlatList
        data={filteredExercises}
        renderItem={renderExercise}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        ListEmptyComponent={renderEmptyState}
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={handleCreateNew}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* Form Modal */}
      <ExerciseFormModal
        visible={formModalVisible}
        exercise={exerciseToEdit}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

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
  searchContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  filterContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterList: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginHorizontal: 4,
  },
  filterChipActive: {
    backgroundColor: '#2196F3',
  },
  filterChipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  list: {
    padding: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 28,
    color: '#fff',
    fontWeight: '300',
  },
});
