/**
 * RoutinesScreen - Routine Management
 * Sprint 14 - US-133
 *
 * Main screen for routine management with list and actions
 */

import { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getRoutines,
  deleteRoutine,
  duplicateRoutine,
  type RoutineWithStats,
} from '../api/routines.api';
import { RoutineCard } from '../components/routines/RoutineCard';
import { EmptyState } from '../components/common/EmptyState';
import { Toast } from '../components/common/Toast';

// TODO: Import navigation when implemented
// import { useNavigation } from '@react-navigation/native';

export function RoutinesScreen() {
  // const navigation = useNavigation();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const queryClient = useQueryClient();

  // React Query for data fetching
  const {
    data: routines = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['routines'],
    queryFn: () => getRoutines(),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteRoutine,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines'] });
      setToast({ message: 'Rutina eliminada', type: 'success' });
    },
    onError: (error: Error) => {
      const axiosError = error as { response?: { data?: { message?: string } } };
      setToast({
        message: axiosError.response?.data?.message || 'Error al eliminar rutina',
        type: 'error',
      });
    },
  });

  // Duplicate mutation
  const duplicateMutation = useMutation({
    mutationFn: duplicateRoutine,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines'] });
      setToast({ message: 'Rutina duplicada', type: 'success' });
    },
    onError: (error: Error) => {
      const axiosError = error as { response?: { data?: { message?: string } } };
      setToast({
        message: axiosError.response?.data?.message || 'Error al duplicar rutina',
        type: 'error',
      });
    },
  });

  const handleRoutinePress = (routine: RoutineWithStats) => {
    // TODO: Navigate to detail screen
    // navigation.navigate('RoutineDetail', { id: routine.id });
    console.log('Navigate to detail:', routine.id);
  };

  const handleStartRoutine = (routine: RoutineWithStats) => {
    // TODO: Navigate to execute routine screen
    // navigation.navigate('ExecuteRoutine', { routineId: routine.id });
    console.log('Start routine:', routine.id);
    setToast({ message: `Iniciando "${routine.name}"...`, type: 'success' });
  };

  const handleRoutineLongPress = (routine: RoutineWithStats) => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancelar', 'Editar', 'Duplicar', 'Eliminar'],
          destructiveButtonIndex: 3,
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) handleEdit(routine);
          else if (buttonIndex === 2) handleDuplicate(routine);
          else if (buttonIndex === 3) handleDelete(routine);
        }
      );
    } else {
      // Android: show alert with options
      Alert.alert('Opciones de Rutina', routine.name, [
        {
          text: 'Editar',
          onPress: () => handleEdit(routine),
        },
        {
          text: 'Duplicar',
          onPress: () => handleDuplicate(routine),
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => handleDelete(routine),
        },
        {
          text: 'Cancelar',
          style: 'cancel',
        },
      ]);
    }
  };

  const handleEdit = (routine: RoutineWithStats) => {
    // TODO: Navigate to edit screen
    // navigation.navigate('RoutineForm', { routineId: routine.id });
    console.log('Edit routine:', routine.id);
  };

  const handleDuplicate = (routine: RoutineWithStats) => {
    Alert.alert('Duplicar Rutina', `¿Crear una copia de "${routine.name}"?`, [
      {
        text: 'Cancelar',
        style: 'cancel',
      },
      {
        text: 'Duplicar',
        onPress: () => duplicateMutation.mutate(routine.id),
      },
    ]);
  };

  const handleDelete = (routine: RoutineWithStats) => {
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

  const handleCreateNew = () => {
    // TODO: Navigate to create screen
    // navigation.navigate('RoutineForm');
    console.log('Create new routine');
  };

  const renderRoutine = ({ item }: { item: RoutineWithStats }) => (
    <RoutineCard
      routine={item}
      onPress={handleRoutinePress}
      onStart={handleStartRoutine}
      onLongPress={handleRoutineLongPress}
    />
  );

  const renderEmptyState = () => (
    <EmptyState
      icon="📋"
      title="No tienes rutinas"
      description="Crea tu primera rutina para organizar tus entrenamientos"
      actionLabel="Crear rutina"
      onAction={handleCreateNew}
    />
  );

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Cargando rutinas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Routine List */}
      <FlatList
        data={routines}
        renderItem={renderRoutine}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        ListEmptyComponent={renderEmptyState}
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={handleCreateNew}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

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
