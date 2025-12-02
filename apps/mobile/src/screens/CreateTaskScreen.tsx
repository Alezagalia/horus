/**
 * CreateTaskScreen
 * Sprint 7 - US-062
 *
 * Pantalla para crear una nueva tarea con formulario completo
 */

import React, { useState } from 'react';
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
import { createTask } from '../api/tasks.api';
import { PriorityPicker } from '../components/PriorityPicker';
import { CategoryPicker } from '../components/CategoryPicker';
import { createTaskSchema, CreateTaskFormData } from '../utils/taskValidation';

interface CreateTaskScreenProps {
  navigation: any;
}

export const CreateTaskScreen: React.FC<CreateTaskScreenProps> = ({ navigation }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [priority, setPriority] = useState<'alta' | 'media' | 'baja'>('media');
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [noDate, setNoDate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const validateForm = (): boolean => {
    try {
      const formData: CreateTaskFormData = {
        title,
        description: description || undefined,
        categoryId,
        priority,
        dueDate: dueDate?.toISOString(),
      };

      createTaskSchema.parse(formData);
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
      setLoading(true);

      const taskData = {
        title: title.trim(),
        description: description.trim() || undefined,
        categoryId,
        priority,
        dueDate: dueDate?.toISOString(),
      };

      await createTask(taskData);

      Alert.alert('Éxito', 'Tarea creada correctamente', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      console.error('Error creating task:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'No se pudo crear la tarea. Intenta nuevamente.'
      );
    } finally {
      setLoading(false);
    }
  };

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
            autoFocus
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

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#FFF" />
              <Text style={styles.submitButtonText}>Crear Tarea</Text>
            </>
          )}
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
    padding: 16,
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
  submitButton: {
    flexDirection: 'row',
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#B0BEC5',
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
