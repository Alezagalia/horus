/**
 * TareasScreen
 * Sprint 7 - US-061
 *
 * Pantalla principal de gestión de tareas con:
 * - Lista de tareas con TaskCard
 * - Barra de filtros (estado, prioridad, fecha)
 * - Toggle rápido con checkbox
 * - Pull-to-refresh
 * - FAB para crear tarea
 * - Empty state
 * - Loading states
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Task, TaskStatus, Priority, getTasks, toggleTaskStatus } from '../api/tasks.api';
import { TaskCard } from '../components/TaskCard';
import { TaskFilterBar } from '../components/TaskFilterBar';

type StatusFilter = 'all' | TaskStatus;
type PriorityFilter = 'all' | Priority;
type DateFilter = 'all' | 'overdue' | 'today' | 'week' | 'none';

interface TareasScreenProps {
  navigation: any;
}

export const TareasScreen: React.FC<TareasScreenProps> = ({ navigation }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [togglingTaskId, setTogglingTaskId] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');

  useEffect(() => {
    loadTasks();
  }, [statusFilter, priorityFilter, dateFilter]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const filters: any = {};

      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }

      if (priorityFilter !== 'all') {
        filters.priority = priorityFilter;
      }

      if (dateFilter !== 'all') {
        filters.dueDateFilter = dateFilter;
      }

      const data = await getTasks(filters);
      setTasks(data);
    } catch (error) {
      console.error('Error loading tasks:', error);
      // TODO: Show error toast/alert
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTasks();
    setRefreshing(false);
  };

  const handleToggle = async (taskId: string) => {
    try {
      setTogglingTaskId(taskId);
      const updatedTask = await toggleTaskStatus(taskId);

      // Update task in list
      setTasks((prevTasks) => prevTasks.map((task) => (task.id === taskId ? updatedTask : task)));
    } catch (error: any) {
      console.error('Error toggling task:', error);
      // TODO: Show error toast/alert
      if (error.response?.status === 400) {
        alert('No se puede cambiar el estado de tareas canceladas');
      }
    } finally {
      setTogglingTaskId(null);
    }
  };

  const handleTaskPress = (taskId: string) => {
    // TODO: Navigate to TaskDetailScreen when US-063 is implemented
    console.log('Navigate to task detail:', taskId);
    // navigation.navigate('TaskDetail', { taskId });
  };

  const handleCreateTask = () => {
    // TODO: Navigate to CreateTaskScreen when US-062 is implemented
    console.log('Navigate to create task');
    // navigation.navigate('CreateTask');
  };

  const renderEmptyState = () => {
    if (loading) return null;

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="checkbox-outline" size={80} color="#CCC" />
        <Text style={styles.emptyTitle}>No hay tareas</Text>
        <Text style={styles.emptySubtitle}>
          {statusFilter !== 'all' || priorityFilter !== 'all' || dateFilter !== 'all'
            ? 'Intenta cambiar los filtros'
            : 'Crea tu primera tarea tocando el botón +'}
        </Text>
      </View>
    );
  };

  const renderTask = ({ item }: { item: Task }) => (
    <TaskCard
      task={item}
      onPress={() => handleTaskPress(item.id)}
      onToggle={handleToggle}
      isToggling={togglingTaskId === item.id}
    />
  );

  return (
    <View style={styles.container}>
      {/* Filter Bar */}
      <TaskFilterBar
        selectedStatus={statusFilter}
        selectedPriority={priorityFilter}
        selectedDateFilter={dateFilter}
        onStatusChange={setStatusFilter}
        onPriorityChange={setPriorityFilter}
        onDateFilterChange={setDateFilter}
      />

      {/* Loading State */}
      {loading && !refreshing && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Cargando tareas...</Text>
        </View>
      )}

      {/* Task List - Optimized for performance (US-108) */}
      {!loading && (
        <FlatList
          data={tasks}
          renderItem={renderTask}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            tasks.length === 0 && styles.listContentEmpty,
          ]}
          ListEmptyComponent={renderEmptyState}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          showsVerticalScrollIndicator={false}
          // Performance optimizations (US-108)
          windowSize={10}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          removeClippedSubviews={true}
          initialNumToRender={15}
        />
      )}

      {/* FAB - Create Task Button */}
      <TouchableOpacity style={styles.fab} onPress={handleCreateTask} activeOpacity={0.8}>
        <Ionicons name="add" size={28} color="#FFF" />
      </TouchableOpacity>

      {/* Task Counter */}
      {!loading && tasks.length > 0 && (
        <View style={styles.counterContainer}>
          <Text style={styles.counterText}>
            {tasks.length} {tasks.length === 1 ? 'tarea' : 'tareas'}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  listContent: {
    paddingVertical: 8,
  },
  listContentEmpty: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  counterContainer: {
    position: 'absolute',
    bottom: 86,
    right: 20,
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  counterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
});
