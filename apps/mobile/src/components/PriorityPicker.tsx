/**
 * PriorityPicker Component
 * Sprint 7 - US-062
 *
 * Selector visual de prioridad con iconos y colores
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Priority } from '../api/tasks.api';

interface PriorityOption {
  value: Priority;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bgColor: string;
}

const PRIORITY_OPTIONS: PriorityOption[] = [
  {
    value: 'alta',
    label: 'Alta',
    icon: 'warning',
    color: '#8B0000',
    bgColor: '#FFB3B3',
  },
  {
    value: 'media',
    label: 'Media',
    icon: 'alert-circle',
    color: '#806600',
    bgColor: '#FFEB9C',
  },
  {
    value: 'baja',
    label: 'Baja',
    icon: 'information-circle',
    color: '#2D5016',
    bgColor: '#C6E0B4',
  },
];

interface PriorityPickerProps {
  value: Priority;
  onChange: (priority: Priority) => void;
  error?: string;
}

export const PriorityPicker: React.FC<PriorityPickerProps> = ({ value, onChange, error }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Prioridad</Text>
      <View style={styles.optionsContainer}>
        {PRIORITY_OPTIONS.map((option) => {
          const isSelected = value === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.option,
                { backgroundColor: isSelected ? option.bgColor : '#F5F5F5' },
                isSelected && styles.optionSelected,
              ]}
              onPress={() => onChange(option.value)}
              activeOpacity={0.7}
            >
              <Ionicons name={option.icon} size={24} color={isSelected ? option.color : '#999'} />
              <Text
                style={[
                  styles.optionLabel,
                  { color: isSelected ? option.color : '#666' },
                  isSelected && styles.optionLabelSelected,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
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
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  option: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginHorizontal: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionSelected: {
    borderColor: '#2196F3',
  },
  optionLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  optionLabelSelected: {
    fontWeight: '700',
  },
  error: {
    fontSize: 12,
    color: '#D32F2F',
    marginTop: 4,
  },
});
