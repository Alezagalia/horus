/**
 * HabitsListScreen - Complete Implementation
 * Sprint 3 - US-022, US-024
 * Sprint 6 - US-053: Added habit reactivation feature
 * Sprint 6 - US-055: Integrated notification cancellation on habit deletion
 *
 * Main screen for habit management with search, filters, delete, and reactivate functionality
 */

import { useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Switch,
  Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getHabits,
  deleteHabit,
  updateHabit,
  reactivateHabit,
  type Habit,
} from '../api/habits.api';
import { getCategories } from '../api/categories.api';
import { Scope } from '@horus/shared';
import { HabitCard } from '../components/habits/HabitCard';
import { EmptyState } from '../components/common/EmptyState';
import { Toast } from '../components/common/Toast';
import { ReactivateHabitDialog } from '../components/habits/ReactivateHabitDialog';
import { cancelHabitNotification } from '../services/NotificationService';

interface HabitsListScreenProps {
  onCreateNew?: () => void;
  onHabitPress?: (habitId: string) => void;
}

export function HabitsListScreen({ onCreateNew, onHabitPress }: HabitsListScreenProps = {}) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [showInactive, setShowInactive] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [reactivateDialogVisible, setReactivateDialogVisible] = useState(false);
  const [habitToReactivate, setHabitToReactivate] = useState<Habit | null>(null);
  const deletedHabitRef = useRef<Habit | null>(null);
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch habits
  const {
    data: habits = [],
    isLoading: isLoadingHabits,
    refetch: refetchHabits,
    isRefetching,
  } = useQuery({
    queryKey: ['habits', selectedCategoryId],
    queryFn: () => getHabits(selectedCategoryId ? { categoryId: selectedCategoryId } : undefined),
  });

  // Fetch categories for filter dropdown
  const { data: categories = [] } = useQuery({
    queryKey: ['categories', Scope.HABITOS],
    queryFn: () => getCategories({ scope: Scope.HABITOS }),
  });

  // Filter habits based on search and inactive toggle
  const filteredHabits = habits.filter((habit) => {
    const matchesSearch = habit.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesActive = showInactive || habit.isActive;
    return matchesSearch && matchesActive;
  });

  const handleHabitPress = (habit: Habit) => {
    if (onHabitPress) {
      onHabitPress(habit.id);
    }
    // Navigation handled by wrapper
  };

  const handleCreateNew = () => {
    if (onCreateNew) {
      onCreateNew();
    }
    // Navigation handled by wrapper
  };

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteHabit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });

  // Reactivate mutation (for undo)
  const undoReactivateMutation = useMutation({
    mutationFn: (habitId: string) => updateHabit(habitId, { isActive: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });

  // Reactivate mutation with optimistic update (US-053)
  const reactivateMutation = useMutation({
    mutationFn: ({ habitId, reason }: { habitId: string; reason?: string }) =>
      reactivateHabit(habitId, reason ? { reason } : undefined),
    onMutate: async ({ habitId }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['habits'] });

      // Snapshot previous value
      const previousHabits = queryClient.getQueryData(['habits', selectedCategoryId]);

      // Optimistically update
      queryClient.setQueryData(['habits', selectedCategoryId], (old: Habit[] = []) =>
        old.map((habit) => (habit.id === habitId ? { ...habit, isActive: true } : habit))
      );

      return { previousHabits };
    },
    onError: (_error, _variables, context) => {
      // Rollback on error
      if (context?.previousHabits) {
        queryClient.setQueryData(['habits', selectedCategoryId], context.previousHabits);
      }
      Alert.alert('Error', 'No se pudo reactivar el hábito. Intenta nuevamente.');
    },
    onSuccess: () => {
      // Refetch to get server data
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      showToast('Hábito reactivado exitosamente');
    },
  });

  const showToast = (message: string) => {
    setToastMessage(message);
    setToastVisible(true);
  };

  const handleDelete = (habit: Habit) => {
    Alert.alert(
      'Eliminar hábito',
      `¿Eliminar '${habit.name}'? Se mantendrá el historial pero no aparecerá en tu lista.`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            deletedHabitRef.current = habit;

            // Soft delete (isActive = false)
            deleteMutation.mutate(habit.id, {
              onSuccess: async () => {
                showToast('Hábito eliminado');

                // Cancel all scheduled notifications for this habit (US-055)
                await cancelHabitNotification(habit.id);

                // Auto-confirm delete after 5 seconds
                undoTimeoutRef.current = setTimeout(() => {
                  deletedHabitRef.current = null;
                  setToastVisible(false);
                }, 5000);
              },
              onError: () => {
                Alert.alert('Error', 'No se pudo eliminar el hábito');
              },
            });
          },
        },
      ]
    );
  };

  const handleUndo = () => {
    if (deletedHabitRef.current && undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);

      undoReactivateMutation.mutate(deletedHabitRef.current.id, {
        onSuccess: () => {
          setToastVisible(false);
          deletedHabitRef.current = null;
        },
      });
    }
  };

  const handleReactivatePress = (habit: Habit) => {
    setHabitToReactivate(habit);
    setReactivateDialogVisible(true);
  };

  const handleReactivateConfirm = (reason?: string) => {
    if (!habitToReactivate) return;

    reactivateMutation.mutate(
      { habitId: habitToReactivate.id, reason },
      {
        onSettled: () => {
          setReactivateDialogVisible(false);
          setHabitToReactivate(null);
        },
      }
    );
  };

  const handleReactivateCancel = () => {
    setReactivateDialogVisible(false);
    setHabitToReactivate(null);
  };

  const renderCategoryFilter = () => {
    return (
      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>Categoría:</Text>
        <View style={styles.categoryChips}>
          <TouchableOpacity
            style={[styles.categoryChip, !selectedCategoryId && styles.categoryChipActive]}
            onPress={() => setSelectedCategoryId('')}
          >
            <Text
              style={[
                styles.categoryChipText,
                !selectedCategoryId && styles.categoryChipTextActive,
              ]}
            >
              Todas
            </Text>
          </TouchableOpacity>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryChip,
                selectedCategoryId === category.id && styles.categoryChipActive,
                { borderColor: category.color || '#9E9E9E' },
              ]}
              onPress={() => setSelectedCategoryId(category.id)}
            >
              <Text style={styles.categoryChipIcon}>{category.icon}</Text>
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategoryId === category.id && styles.categoryChipTextActive,
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderSearchBar = () => {
    return (
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar hábitos..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderInactiveToggle = () => {
    return (
      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Mostrar inactivos</Text>
        <Switch
          value={showInactive}
          onValueChange={setShowInactive}
          trackColor={{ false: '#ddd', true: '#81C784' }}
          thumbColor={showInactive ? '#4CAF50' : '#f4f3f4'}
        />
      </View>
    );
  };

  const renderHabit = ({ item }: { item: Habit }) => (
    <HabitCard
      habit={item}
      onPress={handleHabitPress}
      onDelete={item.isActive ? handleDelete : undefined}
      onReactivate={!item.isActive ? handleReactivatePress : undefined}
    />
  );

  const renderEmptyState = () => {
    if (searchQuery || selectedCategoryId) {
      return (
        <EmptyState
          icon="🔍"
          title="No se encontraron hábitos"
          description="Intenta con otros filtros o búsqueda"
          actionLabel="Limpiar filtros"
          onAction={() => {
            setSearchQuery('');
            setSelectedCategoryId('');
          }}
        />
      );
    }

    return (
      <EmptyState
        icon="🎯"
        title="No tienes hábitos"
        description="Crea tu primer hábito para empezar a seguir tus objetivos"
        actionLabel="Crear primer hábito"
        onAction={handleCreateNew}
      />
    );
  };

  if (isLoadingHabits) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Cargando hábitos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis Hábitos</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleCreateNew}>
          <Text style={styles.addButtonIcon}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      {renderSearchBar()}

      {/* Filters */}
      {renderCategoryFilter()}

      {/* Inactive Toggle */}
      {renderInactiveToggle()}

      {/* Stats Summary */}
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          {filteredHabits.length} hábito{filteredHabits.length !== 1 ? 's' : ''}
          {selectedCategoryId && ' en esta categoría'}
        </Text>
      </View>

      {/* Habits List - Optimized for performance (US-108) */}
      <FlatList
        data={filteredHabits}
        renderItem={renderHabit}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetchHabits} />}
        ListEmptyComponent={renderEmptyState}
        // Performance optimizations (US-108)
        windowSize={8}
        maxToRenderPerBatch={8}
        updateCellsBatchingPeriod={50}
        removeClippedSubviews={true}
        initialNumToRender={12}
      />

      {/* Toast with Undo */}
      <Toast
        visible={toastVisible}
        message={toastMessage}
        onDismiss={() => setToastVisible(false)}
        action={{ label: 'Deshacer', onPress: handleUndo }}
        duration={5000}
      />

      {/* Reactivate Dialog */}
      <ReactivateHabitDialog
        visible={reactivateDialogVisible}
        habit={habitToReactivate}
        onConfirm={handleReactivateConfirm}
        onCancel={handleReactivateCancel}
        isLoading={reactivateMutation.isPending}
      />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212121',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  addButtonIcon: {
    fontSize: 24,
    color: '#fff',
    fontWeight: '300',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#212121',
  },
  clearButton: {
    padding: 4,
  },
  clearButtonText: {
    fontSize: 18,
    color: '#999',
  },
  filterRow: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  categoryChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  categoryChipActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
    borderWidth: 2,
  },
  categoryChipIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  categoryChipText: {
    fontSize: 14,
    color: '#666',
  },
  categoryChipTextActive: {
    color: '#1976D2',
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
  },
  toggleLabel: {
    fontSize: 15,
    color: '#212121',
    fontWeight: '500',
  },
  statsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  statsText: {
    fontSize: 13,
    color: '#666',
  },
  list: {
    padding: 16,
    paddingTop: 8,
  },
});
