/**
 * ReactivateHabitDialog Component
 * Sprint 6 - US-053
 *
 * Dialog for confirming habit reactivation with optional reason input
 */

import { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import type { Habit } from '../../api/habits.api';

interface ReactivateHabitDialogProps {
  visible: boolean;
  habit: Habit | null;
  onConfirm: (reason?: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ReactivateHabitDialog = ({
  visible,
  habit,
  onConfirm,
  onCancel,
  isLoading = false,
}: ReactivateHabitDialogProps) => {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    onConfirm(reason.trim() || undefined);
    setReason(''); // Reset for next time
  };

  const handleCancel = () => {
    setReason('');
    onCancel();
  };

  if (!habit) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleCancel}>
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.icon}>🔄</Text>
            <Text style={styles.title}>Reactivar Hábito</Text>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.message}>
              ¿Quieres reactivar <Text style={styles.habitName}>"{habit.name}"</Text>?
            </Text>
            <Text style={styles.subMessage}>Tu racha comenzará de nuevo desde cero.</Text>

            {/* Optional reason input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Razón de reactivación (opcional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: Quiero retomar este hábito..."
                placeholderTextColor="#999"
                value={reason}
                onChangeText={setReason}
                maxLength={200}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                editable={!isLoading}
              />
              <Text style={styles.charCount}>{reason.length}/200</Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancel}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={handleConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.confirmButtonText}>Reactivar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialog: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  icon: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212121',
  },
  content: {
    padding: 20,
  },
  message: {
    fontSize: 16,
    color: '#424242',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 8,
  },
  habitName: {
    fontWeight: '700',
    color: '#FF9800',
  },
  subMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  inputContainer: {
    marginTop: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#212121',
    minHeight: 80,
    backgroundColor: '#f9f9f9',
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderRightWidth: 1,
    borderRightColor: '#f0f0f0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  confirmButton: {
    backgroundColor: '#FF9800',
    borderBottomRightRadius: 16,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
