/**
 * ExerciseFormModal Component
 * Sprint 14 - US-132
 *
 * Modal for creating and editing exercises
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { MuscleGroup, type Exercise, type CreateExerciseDTO } from '@horus/shared';

interface ExerciseFormModalProps {
  visible: boolean;
  exercise?: Exercise | null; // null for create, Exercise for edit
  onClose: () => void;
  onSubmit: (data: CreateExerciseDTO & { id?: string }) => void;
  isLoading?: boolean;
}

const MUSCLE_GROUPS: { value: MuscleGroup; label: string; icon: string }[] = [
  { value: MuscleGroup.PECHO, label: 'Pecho', icon: '💪' },
  { value: MuscleGroup.ESPALDA, label: 'Espalda', icon: '🦅' },
  { value: MuscleGroup.PIERNAS, label: 'Piernas', icon: '🦵' },
  { value: MuscleGroup.HOMBROS, label: 'Hombros', icon: '⚡' },
  { value: MuscleGroup.BRAZOS, label: 'Brazos', icon: '💪' },
  { value: MuscleGroup.ABDOMEN, label: 'Abdomen', icon: '🔥' },
  { value: MuscleGroup.CARDIO, label: 'Cardio', icon: '❤️' },
  { value: MuscleGroup.OTRO, label: 'Otro', icon: '🏋️' },
];

export const ExerciseFormModal = ({
  visible,
  exercise,
  onClose,
  onSubmit,
  isLoading = false,
}: ExerciseFormModalProps) => {
  const isEditMode = !!exercise;

  // Form state
  const [name, setName] = useState('');
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>(MuscleGroup.OTRO);
  const [notes, setNotes] = useState('');
  const [nameError, setNameError] = useState<string>('');

  // Initialize form with exercise data in edit mode
  useEffect(() => {
    if (exercise) {
      setName(exercise.name);
      setMuscleGroup(exercise.muscleGroup || MuscleGroup.OTRO);
      setNotes(exercise.notes || '');
    }
  }, [exercise]);

  // Reset form when modal closes
  useEffect(() => {
    if (!visible) {
      setTimeout(() => {
        setName('');
        setMuscleGroup(MuscleGroup.OTRO);
        setNotes('');
        setNameError('');
      }, 300); // Wait for modal animation
    }
  }, [visible]);

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

    const data: CreateExerciseDTO & { id?: string } = {
      name: name.trim(),
      muscleGroup,
      notes: notes.trim() || null,
    };

    if (isEditMode && exercise) {
      data.id = exercise.id;
    }

    onSubmit(data);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>{isEditMode ? 'Editar Ejercicio' : 'Nuevo Ejercicio'}</Text>
            <TouchableOpacity onPress={onClose} disabled={isLoading}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
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
                placeholder="Ej: Press Banca"
                maxLength={100}
                editable={!isLoading}
              />
              {nameError && <Text style={styles.errorText}>{nameError}</Text>}
            </View>

            {/* Muscle Group Picker */}
            <View style={styles.field}>
              <Text style={styles.label}>Grupo Muscular *</Text>
              <View style={styles.muscleGroupGrid}>
                {MUSCLE_GROUPS.map((group) => (
                  <TouchableOpacity
                    key={group.value}
                    style={[
                      styles.muscleGroupOption,
                      muscleGroup === group.value && styles.muscleGroupOptionSelected,
                    ]}
                    onPress={() => setMuscleGroup(group.value)}
                    disabled={isLoading}
                  >
                    <Text style={styles.muscleGroupIcon}>{group.icon}</Text>
                    <Text
                      style={[
                        styles.muscleGroupLabel,
                        muscleGroup === group.value && styles.muscleGroupLabelSelected,
                      ]}
                    >
                      {group.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Notes Input */}
            <View style={styles.field}>
              <Text style={styles.label}>Notas (opcional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Ej: Mantener codos a 45°"
                multiline
                numberOfLines={3}
                maxLength={500}
                editable={!isLoading}
              />
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
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
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
    padding: 4,
  },
  content: {
    padding: 20,
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
  muscleGroupGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  muscleGroupOption: {
    width: '23%',
    aspectRatio: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  muscleGroupOptionSelected: {
    borderColor: '#2196F3',
    backgroundColor: '#E3F2FD',
    borderWidth: 2,
  },
  muscleGroupIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  muscleGroupLabel: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
  muscleGroupLabelSelected: {
    color: '#2196F3',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
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
