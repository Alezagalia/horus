/**
 * ColorPicker Component
 * Sprint 2 - US-016
 *
 * Color picker with 12 predefined colors
 */

import { View, TouchableOpacity, StyleSheet } from 'react-native';

interface ColorPickerProps {
  selectedColor?: string;
  onSelect: (color: string) => void;
}

// Predefined color palette (Material Design inspired)
const COLORS = [
  '#F44336', // Red
  '#E91E63', // Pink
  '#9C27B0', // Purple
  '#673AB7', // Deep Purple
  '#3F51B5', // Indigo
  '#2196F3', // Blue
  '#00BCD4', // Cyan
  '#009688', // Teal
  '#4CAF50', // Green
  '#FF9800', // Orange
  '#FF5722', // Deep Orange
  '#795548', // Brown
];

export const ColorPicker = ({ selectedColor, onSelect }: ColorPickerProps) => {
  return (
    <View style={styles.container}>
      {COLORS.map((color) => (
        <TouchableOpacity
          key={color}
          style={[
            styles.colorButton,
            { backgroundColor: color },
            selectedColor === color && styles.colorButtonSelected,
          ]}
          onPress={() => onSelect(color)}
          activeOpacity={0.7}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorButtonSelected: {
    borderColor: '#333',
    borderWidth: 3,
  },
});
