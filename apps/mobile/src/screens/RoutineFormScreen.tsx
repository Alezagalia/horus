/**
 * RoutineFormScreen - Create/Edit Routine
 * Sprint 14 - US-133
 *
 * Form for creating and editing routines
 * Note: Simplified version - drag-to-reorder and advanced features pending
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRoutineById, createRoutine, updateRoutine } from '../api/routines.api';
import type { CreateRoutineDTO } from '@horus/shared';
import { Toast } from '../components/common/Toast';

interface RoutineFormScreenProps {
  routineId?: string;
  // TODO: Add navigation when implemented
  // navigation: any;
}

export function RoutineFormScreen({ routineId }: RoutineFormScreenProps) {
  const isEditMode = !!routineId;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [nameError, setNameError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const queryClient = useQueryClient();

  // Fetch routine if editing
  const { data: routine, isLoading: isLoadingRoutine } = useQuery({
    queryKey: ['routine', routineId],
    queryFn: () => getRoutineById(routineId!),
    enabled: isEditMode,
  });

  // Initialize form with routine data in edit mode
  useEffect(() => {
    if (routine) {
      setName(routine.name);
      setDescription(routine.description || '');
    }
  }, [routine]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: createRoutine,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines'] });
      setToast({ message: 'Rutina creada', type: 'success' });
      // TODO: Navigate back
      // navigation.goBack();
    },
    onError: (error: Error) => {
      const axiosError = error as { response?: { data?: { message?: string } } };
      setToast({
        message: axiosError.response?.data?.message || 'Error al crear rutina',
        type: 'error',
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateRoutineDTO }) => updateRoutine(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines'] });
      queryClient.invalidateQueries({ queryKey: ['routine', routineId] });
      setToast({ message: 'Rutina actualizada', type: 'success' });
      // TODO: Navigate back
      // navigation.goBack();
    },
    onError: (error: Error) => {
      const axiosError = error as { response?: { data?: { message?: string } } };
      setToast({
        message: axiosError.response?.data?.message || 'Error al actualizar rutina',
        type: 'error',
      });
    },
  });

  const validateName = (value: string): boolean => {
    if (!value.trim()) {
      setNameError('El nombre es requerido');
      return false;
    }
    if (value.length > 100) {
      setNameError('El nombre no puede exceder 100 caracteres');
      return false;
    }
    setNameError('');
    return true;
  };

  const handleSubmit = () => {
    if (!validateName(name)) return;

    // Note: Simplified - only saves name and description
    // Exercise management will be added in future iteration
    const data: CreateRoutineDTO = {
      name: name.trim(),
      description: description.trim() || null,
      exercises: routine?.exercises || [],
    };

    if (isEditMode && routineId) {
      updateMutation.mutate({ id: routineId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  if (isEditMode && isLoadingRoutine) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Cargando rutina...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Name Input */}
        <View style={styles.field}>
          <Text style={styles.label}>Nombre *</Text>
          <TextInput
            style={[styles.input, nameError ? styles.inputError : null]}
            value={name}
            onChangeText={(value) => {
              setName(value);
              validateName(value);
            }}
            placeholder="Ej: Push Day, Leg Day"
            maxLength={100}
            editable={!isLoading}
          />
          {nameError && <Text style={styles.errorText}>{nameError}</Text>}
        </View>

        {/* Description Input */}
        <View style={styles.field}>
          <Text style={styles.label}>Descripción (opcional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Ej: Rutina enfocada en pecho, hombros y tríceps"
            multiline
            numberOfLines={3}
            maxLength={500}
            editable={!isLoading}
          />
        </View>

        {/* Exercises Section - Placeholder */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ejercicios ({routine?.exercises?.length || 0})</Text>
          <View style={styles.placeholder}>
            <Text style={styles.placeholderIcon}>🏋️</Text>
            <Text style={styles.placeholderText}>Gestión completa de ejercicios próximamente</Text>
            <Text style={styles.placeholderSubtext}>
              Podrás agregar, reordenar y configurar ejercicios con drag & drop
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => {
              // TODO: Navigate back
              // navigation.goBack();
              console.log('Cancel');
            }}
            disabled={isLoading}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>{isEditMode ? 'Guardar' : 'Crear'}</Text>
            )}
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  field: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#f44336',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#f44336',
    fontSize: 12,
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  placeholder: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  placeholderIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  placeholderSubtext: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  submitButton: {
    backgroundColor: '#2196F3',
  },
  submitButtonDisabled: {
    backgroundColor: '#B0BEC5',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
