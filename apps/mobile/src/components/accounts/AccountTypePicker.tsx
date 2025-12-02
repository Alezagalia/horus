/**
 * AccountTypePicker Component
 * Sprint 9 - US-079
 *
 * Picker component for selecting account type with icons and colors
 */

import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export type AccountType = 'efectivo' | 'banco' | 'billetera_digital' | 'tarjeta';

interface AccountTypePickerProps {
  value: AccountType;
  onChange: (type: AccountType) => void;
  error?: string;
}

const ACCOUNT_TYPES = [
  {
    type: 'efectivo' as AccountType,
    label: 'Efectivo',
    emoji: '💵',
    color: '#10B981',
  },
  {
    type: 'banco' as AccountType,
    label: 'Banco',
    emoji: '🏦',
    color: '#3B82F6',
  },
  {
    type: 'billetera_digital' as AccountType,
    label: 'Billetera Digital',
    emoji: '📱',
    color: '#8B5CF6',
  },
  {
    type: 'tarjeta' as AccountType,
    label: 'Tarjeta',
    emoji: '💳',
    color: '#F59E0B',
  },
];

export function AccountTypePicker({ value, onChange, error }: AccountTypePickerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Tipo de Cuenta *</Text>
      <View style={styles.optionsGrid}>
        {ACCOUNT_TYPES.map((item) => {
          const isSelected = value === item.type;
          return (
            <TouchableOpacity
              key={item.type}
              style={[styles.option, isSelected && { borderColor: item.color, borderWidth: 3 }]}
              onPress={() => onChange(item.type)}
              activeOpacity={0.7}
            >
              <Text style={styles.emoji}>{item.emoji}</Text>
              <Text style={[styles.optionLabel, isSelected && { color: item.color }]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
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
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  option: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    padding: 16,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  emoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  optionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  error: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
});

export { ACCOUNT_TYPES };
