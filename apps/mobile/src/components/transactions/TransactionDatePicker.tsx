/**
 * TransactionDatePicker Component
 * Sprint 9 - US-081
 *
 * Date picker for transaction date
 */

import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { formatDateMedium } from '../../utils/date';

interface TransactionDatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  error?: string;
}

export function TransactionDatePicker({ value, onChange, error }: TransactionDatePickerProps) {
  const [showPicker, setShowPicker] = useState(false);

  const handleChange = (_event: any, selectedDate?: Date) => {
    setShowPicker(Platform.OS === 'ios'); // Keep open on iOS, close on Android
    if (selectedDate) {
      onChange(selectedDate);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Fecha *</Text>

      <TouchableOpacity
        style={[styles.selector, error && styles.selectorError]}
        onPress={() => setShowPicker(true)}
        activeOpacity={0.7}
      >
        <View style={styles.selectedContent}>
          <Ionicons name="calendar-outline" size={20} color="#6B7280" />
          <Text style={styles.dateText}>{formatDateMedium(value.toISOString())}</Text>
        </View>
        <Ionicons name="chevron-down" size={20} color="#6B7280" />
      </TouchableOpacity>

      {error && <Text style={styles.error}>{error}</Text>}

      {showPicker && (
        <DateTimePicker
          value={value}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
          maximumDate={new Date()} // No permitir fechas futuras por ahora
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
  },
  selectorError: {
    borderColor: '#EF4444',
  },
  selectedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  error: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
});
