/**
 * IconPicker Component
 * Sprint 9 - US-079
 *
 * Picker for predefined account icons
 */

import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
}

const ICONS = [
  'wallet',
  'cash',
  'card',
  'briefcase',
  'business',
  'home',
  'car',
  'cart',
  'gift',
  'heart',
  'star',
  'trophy',
  'airplane',
  'restaurant',
  'cafe',
  'game-controller',
];

export function IconPicker({ value, onChange }: IconPickerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Icono (Opcional)</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.iconsScroll}
      >
        {ICONS.map((icon) => {
          const isSelected = value === icon;
          return (
            <TouchableOpacity
              key={icon}
              style={[styles.iconOption, isSelected && styles.iconSelected]}
              onPress={() => onChange(icon)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={icon as keyof typeof Ionicons.glyphMap}
                size={28}
                color={isSelected ? '#4F46E5' : '#6B7280'}
              />
            </TouchableOpacity>
          );
        })}
      </ScrollView>
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
  iconsScroll: {
    gap: 12,
    paddingHorizontal: 4,
  },
  iconOption: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  iconSelected: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
});

export { ICONS };
