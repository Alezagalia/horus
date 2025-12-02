/**
 * ExpenseCategoryPicker Component
 * Sprint 10 - US-089
 *
 * Selector de categorías (solo scope='gastos') para gastos recurrentes
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getCategories } from '../../api/categories.api';

interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
}

interface ExpenseCategoryPickerProps {
  value: string;
  onChange: (categoryId: string) => void;
  error?: string;
  label?: string;
}

export const ExpenseCategoryPicker = ({
  value,
  onChange,
  error,
  label = 'Categoría',
}: ExpenseCategoryPickerProps) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // Fetch categories with scope='gastos'
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories', 'gastos'],
    queryFn: () => getCategories({ scope: 'gastos' }),
  });

  useEffect(() => {
    if (value && categories.length > 0) {
      const category = categories.find((c) => c.id === value);
      setSelectedCategory(category || null);
    }
  }, [value, categories]);

  const handleSelect = (category: Category) => {
    onChange(category.id);
    setSelectedCategory(category);
    setModalVisible(false);
  };

  const renderCategory = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={[styles.categoryItem, value === item.id && styles.categoryItemSelected]}
      onPress={() => handleSelect(item)}
    >
      <View style={[styles.categoryIcon, { backgroundColor: item.color || '#9E9E9E' }]}>
        <Text style={styles.iconText}>{item.icon || '💰'}</Text>
      </View>
      <Text style={styles.categoryName}>{item.name}</Text>
      {value === item.id && (
        <View style={styles.checkmark}>
          <Text style={styles.checkmarkText}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label} *</Text>
      <TouchableOpacity
        style={[styles.selector, error && styles.selectorError]}
        onPress={() => setModalVisible(true)}
      >
        {selectedCategory ? (
          <View style={styles.selectedContent}>
            <View
              style={[
                styles.selectedIcon,
                { backgroundColor: selectedCategory.color || '#9E9E9E' },
              ]}
            >
              <Text style={styles.selectedIconText}>{selectedCategory.icon || '💰'}</Text>
            </View>
            <Text style={styles.selectedText}>{selectedCategory.name}</Text>
          </View>
        ) : (
          <Text style={styles.placeholder}>Seleccionar categoría</Text>
        )}
        <Text style={styles.chevron}>▼</Text>
      </TouchableOpacity>
      {error && <Text style={styles.error}>{error}</Text>}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Categoría</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2196F3" />
                <Text style={styles.loadingText}>Cargando categorías...</Text>
              </View>
            ) : categories.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No hay categorías de gastos disponibles</Text>
              </View>
            ) : (
              <FlatList
                data={categories}
                renderItem={renderCategory}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
              />
            )}
          </View>
        </View>
      </Modal>
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
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    backgroundColor: '#FFF',
    minHeight: 50,
  },
  selectorError: {
    borderColor: '#D32F2F',
  },
  selectedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectedIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  selectedIconText: {
    fontSize: 18,
  },
  selectedText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  placeholder: {
    fontSize: 15,
    color: '#999',
  },
  chevron: {
    fontSize: 12,
    color: '#666',
  },
  error: {
    fontSize: 12,
    color: '#D32F2F',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
    fontWeight: '300',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  categoryItemSelected: {
    backgroundColor: '#E3F2FD',
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 20,
  },
  categoryName: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
