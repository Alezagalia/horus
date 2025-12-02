/**
 * StatusPicker Component
 * Sprint 7 - US-062
 *
 * Selector de estado de tarea (solo para EditTaskScreen)
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { TaskStatus } from '../api/tasks.api';

interface StatusPickerProps {
  value: TaskStatus;
  onChange: (status: TaskStatus) => void;
  error?: string;
}

export const StatusPicker: React.FC<StatusPickerProps> = ({ value, onChange, error }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Estado</Text>
      <View style={[styles.pickerContainer, error && styles.pickerContainerError]}>
        <Picker selectedValue={value} onValueChange={onChange} style={styles.picker}>
          <Picker.Item label="Pendiente" value="pendiente" />
          <Picker.Item label="En Progreso" value="en_progreso" />
          <Picker.Item label="Completada" value="completada" />
          <Picker.Item label="Cancelada" value="cancelada" />
        </Picker>
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    backgroundColor: '#FFF',
  },
  pickerContainerError: {
    borderColor: '#D32F2F',
  },
  picker: {
    height: 50,
  },
  error: {
    fontSize: 12,
    color: '#D32F2F',
    marginTop: 4,
  },
});
