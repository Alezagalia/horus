/**
 * TransactionCategorySelector Component
 * Sprint 9 - US-081
 *
 * Selector for choosing a category for transactions (scope: gastos)
 */

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { getCategories } from '../../api/categories.api';
import { Scope } from '@horus/shared';

interface TransactionCategorySelectorProps {
  value?: string;
  onChange: (categoryId: string) => void;
  error?: string;
}

export function TransactionCategorySelector({
  value,
  onChange,
  error,
}: TransactionCategorySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Fetch categories with scope 'gastos'
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories', Scope.GASTOS],
    queryFn: () => getCategories({ scope: Scope.GASTOS }),
  });

  const selectedCategory = categories.find((cat) => cat.id === value);
  const activeCategories = categories.filter((cat) => cat.isActive);

  const handleSelect = (categoryId: string) => {
    onChange(categoryId);
    setIsOpen(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Categoría *</Text>

      {/* Selected Category Display */}
      <TouchableOpacity
        style={[styles.selector, error && styles.selectorError]}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.7}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#6B7280" />
        ) : selectedCategory ? (
          <View style={styles.selectedContent}>
            <View
              style={[
                styles.categoryIcon,
                { backgroundColor: selectedCategory.color || '#6B7280' },
              ]}
            >
              <Ionicons
                name={(selectedCategory.icon as any) || 'pricetag'}
                size={20}
                color="#FFFFFF"
              />
            </View>
            <Text style={styles.categoryName}>{selectedCategory.name}</Text>
          </View>
        ) : (
          <Text style={styles.placeholder}>Selecciona una categoría</Text>
        )}
        <Ionicons name="chevron-down" size={20} color="#6B7280" />
      </TouchableOpacity>

      {error && <Text style={styles.error}>{error}</Text>}

      {/* Modal Picker */}
      <Modal visible={isOpen} transparent animationType="slide">
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setIsOpen(false)}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Categoría</Text>
              <TouchableOpacity onPress={() => setIsOpen(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {activeCategories.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="folder-open-outline" size={48} color="#D1D5DB" />
                  <Text style={styles.emptyText}>No hay categorías disponibles</Text>
                  <Text style={styles.emptySubtext}>Crea categorías de gastos primero</Text>
                </View>
              ) : (
                activeCategories.map((category) => {
                  const isSelected = value === category.id;
                  return (
                    <TouchableOpacity
                      key={category.id}
                      style={[styles.categoryOption, isSelected && styles.categoryOptionSelected]}
                      onPress={() => handleSelect(category.id)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.categoryIcon,
                          { backgroundColor: category.color || '#6B7280' },
                        ]}
                      >
                        <Ionicons
                          name={(category.icon as any) || 'pricetag'}
                          size={20}
                          color="#FFFFFF"
                        />
                      </View>
                      <Text style={styles.categoryName}>{category.name}</Text>
                      {isSelected && <Ionicons name="checkmark-circle" size={24} color="#10B981" />}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
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
    flex: 1,
  },
  placeholder: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  error: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  modalContent: {
    padding: 16,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
  },
  categoryOptionSelected: {
    backgroundColor: '#EEF2FF',
    borderWidth: 2,
    borderColor: '#4F46E5',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
});
