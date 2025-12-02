/**
 * TransactionTypeToggle Component
 * Sprint 9 - US-081
 *
 * Toggle button for selecting transaction type (ingreso/egreso)
 */

import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TransactionType } from '../../api/transactions.api';

interface TransactionTypeToggleProps {
  value: TransactionType;
  onChange: (type: TransactionType) => void;
}

export function TransactionTypeToggle({ value, onChange }: TransactionTypeToggleProps) {
  const isIngreso = value === 'ingreso';

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.option, isIngreso && styles.optionIngresoActive]}
        onPress={() => onChange('ingreso')}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-down-circle" size={24} color={isIngreso ? '#FFFFFF' : '#10B981'} />
        <Text style={[styles.optionText, isIngreso && styles.optionTextActive]}>Ingreso</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.option, !isIngreso && styles.optionEgresoActive]}
        onPress={() => onChange('egreso')}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-up-circle" size={24} color={!isIngreso ? '#FFFFFF' : '#EF4444'} />
        <Text style={[styles.optionText, !isIngreso && styles.optionTextActive]}>Egreso</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  option: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  optionIngresoActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  optionEgresoActive: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6B7280',
  },
  optionTextActive: {
    color: '#FFFFFF',
  },
});
