/**
 * EditTaskScreen
 * Sprint 7 - US-062
 *
 * Pantalla para editar una tarea existente con formulario completo
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
  Platform,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { getTaskById, updateTask, deleteTask, Task } from '../api/tasks.api';
import { PriorityPicker } from '../components/PriorityPicker';
import { CategoryPicker } from '../components/CategoryPicker';
import { StatusPicker } from '../components/StatusPicker';
import { editTaskSchema, EditTaskFormData } from '../utils/taskValidation';

interface EditTaskScreenProps {
  navigation: any;
  route: {
    params: {
      taskId: string;
    };
  };
}

export const EditTaskScreen: React.FC<EditTaskScreenProps> = ({ navigation, route }) => {
  const { taskId } = route.params;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [priority, setPriority] = useState<'alta' | 'media' | 'baja'>('media');
  const [status, setStatus] = useState<'pendiente' | 'en_progreso' | 'completada' | 'cancelada'>(
    'pendiente'
  );
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [noDate, setNoDate] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadTask();
  }, [taskId]);

  const loadTask = async () => {
    try {
      setLoading(true);
      const task = await getTaskById(taskId);

      setTitle(task.title);
      setDescription(task.description || '');
      setCategoryId(task.categoryId);
      setPriority(task.priority);
      setStatus(task.status);
      setCancelReason(task.cancelReason || '');

      if (task.dueDate) {
        setDueDate(new Date(task.dueDate));
        setNoDate(false);
      } else {
        setNoDate(true);
      }
    } catch (error: any) {
      console.error('Error loading task:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'No se pudo cargar la tarea. Intenta nuevamente.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDueDate(selectedDate);
      setNoDate(false);
    }
  };

  const handleNoDateToggle = (value: boolean) => {
    setNoDate(value);
    if (value) {
      setDueDate(undefined);
    }
  };

  const handleStatusChange = (
    newStatus: 'pendiente' | 'en_progreso' | 'completada' | 'cancelada'
  ) => {
    setStatus(newStatus);
    // Limpiar razón de cancelación si no es status cancelada
    if (newStatus !== 'cancelada') {
      setCancelReason('');
    }
  };

  const validateForm = (): boolean => {
    try {
      const formData: EditTaskFormData = {
        title,
        description: description || undefined,
        categoryId,
        priority,
        status,
        dueDate: dueDate?.toISOString(),
        cancelReason: cancelReason || undefined,
      };

      editTaskSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error: any) {
      const newErrors: Record<string, string> = {};
      error.errors?.forEach((err: any) => {
        newErrors[err.path[0]] = err.message;
      });
      setErrors(newErrors);
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Error de Validación', 'Por favor corrige los errores en el formulario');
      return;
    }

    try {
      setSubmitting(true);

      const taskData = {
        title: title.trim(),
        description: description.trim() || undefined,
        categoryId,
        priority,
        status,
        dueDate: dueDate?.toISOString(),
        cancelReason: status === 'cancelada' ? cancelReason.trim() : undefined,
      };

      await updateTask(taskId, taskData);

      Alert.alert('Éxito', 'Tarea actualizada correctamente', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      console.error('Error updating task:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'No se pudo actualizar la tarea. Intenta nuevamente.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar Tarea',
      '¿Estás seguro de que deseas eliminar esta tarea? Esta acción no se puede deshacer.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: confirmDelete,
        },
      ]
    );
  };

  const confirmDelete = async () => {
    try {
      setDeleting(true);
      await deleteTask(taskId);

      Alert.alert('Éxito', 'Tarea eliminada correctamente', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      console.error('Error deleting task:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'No se pudo eliminar la tarea. Intenta nuevamente.'
      );
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Cargando tarea...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.form}>
        {/* Title Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Título *</Text>
          <TextInput
            style={[styles.input, errors.title && styles.inputError]}
            value={title}
            onChangeText={setTitle}
            placeholder="Ej: Comprar víveres"
            maxLength={200}
          />
          {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
          <Text style={styles.charCount}>{title.length}/200</Text>
        </View>

        {/* Description Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Descripción</Text>
          <TextInput
            style={[styles.textArea, errors.description && styles.inputError]}
            value={description}
            onChangeText={setDescription}
            placeholder="Detalles adicionales (opcional)"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
        </View>

        {/* Category Picker */}
        <CategoryPicker value={categoryId} onChange={setCategoryId} error={errors.categoryId} />

        {/* Priority Picker */}
        <PriorityPicker value={priority} onChange={setPriority} error={errors.priority} />

        {/* Status Picker */}
        <StatusPicker value={status} onChange={handleStatusChange} error={errors.status} />

        {/* Cancel Reason (shown only if status is cancelada) */}
        {status === 'cancelada' && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Razón de Cancelación *</Text>
            <TextInput
              style={[styles.textArea, errors.cancelReason && styles.inputError]}
              value={cancelReason}
              onChangeText={setCancelReason}
              placeholder="Explica por qué se cancela esta tarea"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              maxLength={200}
            />
            {errors.cancelReason && <Text style={styles.errorText}>{errors.cancelReason}</Text>}
            <Text style={styles.charCount}>{cancelReason.length}/200</Text>
          </View>
        )}

        {/* Due Date Picker */}
        <View style={styles.inputGroup}>
          <View style={styles.dateHeader}>
            <Text style={styles.label}>Fecha de Vencimiento</Text>
            <View style={styles.noDateContainer}>
              <Text style={styles.noDateLabel}>Sin fecha</Text>
              <Switch
                value={noDate}
                onValueChange={handleNoDateToggle}
                trackColor={{ false: '#DDD', true: '#2196F3' }}
                thumbColor="#FFF"
              />
            </View>
          </View>

          {!noDate && (
            <TouchableOpacity
              style={[styles.dateButton, errors.dueDate && styles.inputError]}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color="#666" />
              <Text style={styles.dateButtonText}>
                {dueDate
                  ? dueDate.toLocaleDateString('es-ES', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })
                  : 'Seleccionar fecha'}
              </Text>
            </TouchableOpacity>
          )}

          {errors.dueDate && <Text style={styles.errorText}>{errors.dueDate}</Text>}

          {showDatePicker && (
            <DateTimePicker
              value={dueDate || new Date()}
              mode="date"
              display="default"
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, submitting && styles.saveButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting || deleting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                <Text style={styles.saveButtonText}>Guardar Cambios</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Delete Button */}
          <TouchableOpacity
            style={[styles.deleteButton, deleting && styles.deleteButtonDisabled]}
            onPress={handleDelete}
            disabled={submitting || deleting}
          >
            {deleting ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Ionicons name="trash-outline" size={20} color="#FFF" />
                <Text style={styles.deleteButtonText}>Eliminar Tarea</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
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
    padding: 16,
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
  form: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    backgroundColor: '#FFF',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    backgroundColor: '#FFF',
    minHeight: 100,
  },
  inputError: {
    borderColor: '#D32F2F',
  },
  errorText: {
    fontSize: 12,
    color: '#D32F2F',
    marginTop: 4,
  },
  charCount: {
    fontSize: 11,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  noDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noDateLabel: {
    fontSize: 13,
    color: '#666',
    marginRight: 8,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    backgroundColor: '#FFF',
  },
  dateButtonText: {
    fontSize: 15,
    color: '#333',
    marginLeft: 8,
  },
  buttonContainer: {
    marginTop: 8,
    gap: 12,
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#B0BEC5',
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  deleteButton: {
    flexDirection: 'row',
    backgroundColor: '#D32F2F',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonDisabled: {
    backgroundColor: '#FFCDD2',
  },
  deleteButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
