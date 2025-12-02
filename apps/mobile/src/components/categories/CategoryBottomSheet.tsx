/**
 * CategoryBottomSheet Component
 * Sprint 2 - US-015
 *
 * Bottom sheet with category options: Edit, Set as Default, Delete
 */

import { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import type { Category } from '@horus/shared';

interface CategoryBottomSheetProps {
  category: Category | null;
  visible: boolean;
  onClose: () => void;
  onEdit: (category: Category) => void;
  onSetDefault: (category: Category) => void;
  onDelete: (category: Category) => void;
  currentDefault?: Category | null;
}

export const CategoryBottomSheet = ({
  category,
  visible,
  onClose,
  onEdit,
  onSetDefault,
  onDelete,
  currentDefault,
}: CategoryBottomSheetProps) => {
  const bottomSheetRef = useRef<BottomSheet>(null);

  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible]);

  if (!category) return null;

  const handleDelete = () => {
    if (category.isDefault) {
      Alert.alert('No se puede eliminar', 'No puedes eliminar una categoría por defecto');
      return;
    }

    Alert.alert(
      'Eliminar categoría',
      `¿Eliminar "${category.name}"? No se eliminarán los items asociados.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            onDelete(category);
            onClose();
          },
        },
      ]
    );
  };

  const handleSetDefault = () => {
    if (currentDefault && currentDefault.id !== category.id) {
      Alert.alert('Reemplazar default', `¿Reemplazar "${currentDefault.name}" como default?`, [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Reemplazar',
          style: 'default',
          onPress: () => {
            onSetDefault(category);
            onClose();
          },
        },
      ]);
    } else {
      onSetDefault(category);
      onClose();
    }
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={['50%']}
      onClose={onClose}
      enablePanDownToClose
      index={-1}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.icon}>{category.icon}</Text>
          <Text style={styles.title}>{category.name}</Text>
        </View>

        <TouchableOpacity
          style={styles.option}
          onPress={() => {
            onEdit(category);
            onClose();
          }}
        >
          <Text style={styles.optionIcon}>✏️</Text>
          <Text style={styles.optionText}>Editar categoría</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.option, category.isDefault && styles.optionDisabled]}
          onPress={handleSetDefault}
          disabled={category.isDefault}
        >
          <Text style={styles.optionIcon}>⭐</Text>
          <Text style={styles.optionText}>
            {category.isDefault ? 'Ya es default' : 'Marcar como default'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.option, category.isDefault && styles.optionDisabled]}
          onPress={handleDelete}
          disabled={category.isDefault}
        >
          <Text style={[styles.optionIcon, styles.deleteIcon]}>🗑️</Text>
          <Text style={[styles.optionText, styles.deleteText]}>
            {category.isDefault ? 'No se puede eliminar default' : 'Eliminar'}
          </Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  icon: {
    fontSize: 32,
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
  },
  optionDisabled: {
    opacity: 0.5,
  },
  optionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  deleteIcon: {
    opacity: 0.8,
  },
  deleteText: {
    color: '#d32f2f',
  },
});
