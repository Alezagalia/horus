/**
 * TaskDetailScreen
 * Sprint 7 - US-063
 *
 * Pantalla de detalle de tarea con checklist completo
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  getTaskById,
  toggleTaskStatus,
  TaskWithChecklist,
  ChecklistItem as ChecklistItemType,
  createChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
} from '../api/tasks.api';
import { calcularColorTarea, formatDueDate } from '../utils/taskColors';
import { ChecklistProgressBar } from '../components/ChecklistProgressBar';
import { ChecklistItem } from '../components/ChecklistItem';
import { ChecklistInput } from '../components/ChecklistInput';

interface TaskDetailScreenProps {
  navigation: any;
  route: {
    params: {
      taskId: string;
    };
  };
}

export const TaskDetailScreen: React.FC<TaskDetailScreenProps> = ({ navigation, route }) => {
  const { taskId } = route.params;

  const [loading, setLoading] = useState(true);
  const [task, setTask] = useState<TaskWithChecklist | null>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [tempTitle, setTempTitle] = useState('');
  const [tempDescription, setTempDescription] = useState('');

  useEffect(() => {
    loadTask();
  }, [taskId]);

  const loadTask = async () => {
    try {
      setLoading(true);
      const data = await getTaskById(taskId);
      setTask(data);
      setTempTitle(data.title);
      setTempDescription(data.description || '');
    } catch (error: any) {
      console.error('Error loading task:', error);
      Alert.alert('Error', error.response?.data?.message || 'No se pudo cargar la tarea.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = async () => {
    if (!task) return;

    try {
      const updatedTask = await toggleTaskStatus(taskId);
      setTask({ ...task, ...updatedTask });
    } catch (error: any) {
      console.error('Error toggling task:', error);
      Alert.alert('Error', 'No se pudo cambiar el estado de la tarea.');
    }
  };

  const handleEditTask = () => {
    navigation.navigate('EditTask', { taskId });
  };

  const handleToggleChecklistItem = async (itemId: string) => {
    if (!task) return;

    const item = task.checklistItems.find((i) => i.id === itemId);
    if (!item) return;

    // Optimistic update
    const updatedItems = task.checklistItems.map((i) =>
      i.id === itemId ? { ...i, completed: !i.completed } : i
    );
    setTask({ ...task, checklistItems: updatedItems });

    try {
      await updateChecklistItem(taskId, itemId, { completed: !item.completed });
    } catch (error: any) {
      console.error('Error toggling checklist item:', error);
      // Revert optimistic update
      setTask({ ...task, checklistItems: task.checklistItems });
      Alert.alert('Error', 'No se pudo actualizar el item.');
    }
  };

  const handleAddChecklistItem = async (title: string) => {
    if (!task) return;

    try {
      const newItem = await createChecklistItem(taskId, title);
      setTask({
        ...task,
        checklistItems: [...task.checklistItems, newItem],
      });
    } catch (error: any) {
      console.error('Error adding checklist item:', error);
      Alert.alert('Error', 'No se pudo agregar el item.');
      throw error;
    }
  };

  const handleDeleteChecklistItem = async (itemId: string) => {
    if (!task) return;

    Alert.alert('Eliminar Item', '¿Estás seguro de que deseas eliminar este item?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteChecklistItem(taskId, itemId);
            setTask({
              ...task,
              checklistItems: task.checklistItems.filter((i) => i.id !== itemId),
            });
          } catch (error: any) {
            console.error('Error deleting checklist item:', error);
            Alert.alert('Error', 'No se pudo eliminar el item.');
          }
        },
      },
    ]);
  };

  const getPriorityBadge = () => {
    if (!task) return null;

    const priorityConfig = {
      alta: { label: 'Alta', color: '#D32F2F', bgColor: '#FFCDD2' },
      media: { label: 'Media', color: '#F57C00', bgColor: '#FFE0B2' },
      baja: { label: 'Baja', color: '#388E3C', bgColor: '#C8E6C9' },
    };

    const config = priorityConfig[task.priority];

    return (
      <View style={[styles.priorityBadge, { backgroundColor: config.bgColor }]}>
        <Text style={[styles.priorityText, { color: config.color }]}>{config.label}</Text>
      </View>
    );
  };

  const getStatusChip = () => {
    if (!task) return null;

    const statusConfig = {
      pendiente: { label: 'Pendiente', color: '#757575', bgColor: '#E0E0E0' },
      en_progreso: { label: 'En Progreso', color: '#1976D2', bgColor: '#BBDEFB' },
      completada: { label: 'Completada', color: '#388E3C', bgColor: '#C8E6C9' },
      cancelada: { label: 'Cancelada', color: '#D32F2F', bgColor: '#FFCDD2' },
    };

    const config = statusConfig[task.status];

    return (
      <View style={[styles.statusChip, { backgroundColor: config.bgColor }]}>
        <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
      </View>
    );
  };

  const getRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `Hace ${diffMins}m`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  };

  if (loading || !task) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Cargando tarea...</Text>
      </View>
    );
  }

  const colorResult = calcularColorTarea(task);
  const completedItems = task.checklistItems.filter((i) => i.completed).length;
  const totalItems = task.checklistItems.length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Section */}
      <View style={[styles.header, { backgroundColor: colorResult.backgroundColor }]}>
        <View style={styles.headerTop}>
          {getPriorityBadge()}
          <TouchableOpacity onPress={handleEditTask}>
            <Ionicons name="create-outline" size={24} color={colorResult.textColor} />
          </TouchableOpacity>
        </View>

        {/* Title */}
        {editingTitle ? (
          <TextInput
            style={[styles.titleInput, { color: colorResult.textColor }]}
            value={tempTitle}
            onChangeText={setTempTitle}
            onBlur={() => {
              setEditingTitle(false);
              // TODO: Update title via API
            }}
            autoFocus
            multiline
          />
        ) : (
          <TouchableOpacity onPress={() => setEditingTitle(true)}>
            <Text style={[styles.title, { color: colorResult.textColor }]}>{task.title}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Details Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Detalles</Text>

        {/* Description */}
        <View style={styles.detailRow}>
          <Ionicons name="document-text-outline" size={20} color="#666" />
          {editingDescription ? (
            <TextInput
              style={styles.descriptionInput}
              value={tempDescription}
              onChangeText={setTempDescription}
              onBlur={() => {
                setEditingDescription(false);
                // TODO: Update description via API
              }}
              placeholder="Agregar descripción..."
              multiline
              autoFocus
            />
          ) : (
            <TouchableOpacity
              style={styles.detailContent}
              onPress={() => setEditingDescription(true)}
            >
              <Text style={styles.detailText}>
                {task.description || 'Sin descripción (tap para agregar)'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Category */}
        <View style={styles.detailRow}>
          <Ionicons name="folder-outline" size={20} color="#666" />
          <View style={styles.detailContent}>
            <View
              style={[styles.categoryDot, { backgroundColor: task.category.color || '#999' }]}
            />
            <Text style={styles.detailText}>{task.category.name}</Text>
          </View>
        </View>

        {/* Status */}
        <View style={styles.detailRow}>
          <Ionicons name="flag-outline" size={20} color="#666" />
          <View style={styles.detailContent}>{getStatusChip()}</View>
        </View>

        {/* Due Date */}
        {task.dueDate && (
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={20} color="#666" />
            <View style={styles.detailContent}>
              <Text style={[styles.detailText, { color: colorResult.textColor }]}>
                {formatDueDate(task.dueDate)}
              </Text>
            </View>
          </View>
        )}

        {/* Created */}
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={20} color="#666" />
          <View style={styles.detailContent}>
            <Text style={styles.detailTextSecondary}>Creada {getRelativeDate(task.createdAt)}</Text>
          </View>
        </View>
      </View>

      {/* Checklist Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Checklist</Text>

        <ChecklistProgressBar total={totalItems} completed={completedItems} />

        <View style={styles.checklistContainer}>
          {task.checklistItems.map((item) => (
            <ChecklistItem
              key={item.id}
              id={item.id}
              title={item.title}
              completed={item.completed}
              onToggle={handleToggleChecklistItem}
              onDelete={handleDeleteChecklistItem}
            />
          ))}

          <ChecklistInput onAdd={handleAddChecklistItem} />
        </View>
      </View>

      {/* Actions Section */}
      <View style={styles.actionsSection}>
        <TouchableOpacity style={styles.editButton} onPress={handleEditTask}>
          <Ionicons name="create-outline" size={20} color="#2196F3" />
          <Text style={styles.editButtonText}>Editar Tarea</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.toggleButton,
            task.status === 'completada' ? styles.toggleButtonPending : styles.toggleButtonComplete,
          ]}
          onPress={handleToggleTask}
        >
          <Ionicons
            name={task.status === 'completada' ? 'arrow-undo' : 'checkmark-circle'}
            size={20}
            color="#FFF"
          />
          <Text style={styles.toggleButtonText}>
            {task.status === 'completada' ? 'Marcar Pendiente' : 'Completar Tarea'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  header: {
    padding: 16,
    paddingTop: 20,
    paddingBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(0,0,0,0.2)',
  },
  section: {
    backgroundColor: '#FFF',
    marginTop: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  detailContent: {
    flex: 1,
    marginLeft: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 15,
    color: '#333',
  },
  detailTextSecondary: {
    fontSize: 14,
    color: '#999',
  },
  descriptionInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingBottom: 4,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  checklistContainer: {
    marginTop: 8,
  },
  actionsSection: {
    padding: 16,
    gap: 12,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  editButtonText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
  },
  toggleButtonComplete: {
    backgroundColor: '#4CAF50',
  },
  toggleButtonPending: {
    backgroundColor: '#FF9800',
  },
  toggleButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
