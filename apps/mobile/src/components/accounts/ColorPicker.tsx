/**
 * ColorPicker Component
 * Sprint 9 - US-079
 *
 * Simple color picker with predefined palette
 */

import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

const COLORS = [
  '#10B981', // Green (Efectivo)
  '#3B82F6', // Blue (Banco)
  '#8B5CF6', // Purple (Billetera)
  '#F59E0B', // Orange (Tarjeta)
  '#EF4444', // Red
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#6366F1', // Indigo
  '#84CC16', // Lime
  '#F97316', // Orange
  '#6B7280', // Gray
  '#000000', // Black
];

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Color (Opcional)</Text>
      <View style={styles.colorsGrid}>
        {COLORS.map((color) => {
          const isSelected = value === color;
          return (
            <TouchableOpacity
              key={color}
              style={[
                styles.colorOption,
                { backgroundColor: color },
                isSelected && styles.colorSelected,
              ]}
              onPress={() => onChange(color)}
              activeOpacity={0.7}
            >
              {isSelected && <Ionicons name="checkmark" size={20} color="#FFFFFF" />}
            </TouchableOpacity>
          );
        })}
      </View>
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
  colorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  colorSelected: {
    elevation: 4,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    transform: [{ scale: 1.1 }],
  },
});

export { COLORS };
