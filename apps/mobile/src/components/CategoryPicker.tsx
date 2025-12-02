/**
 * CategoryPicker Component
 * Sprint 7 - US-062
 *
 * Selector de categoría (solo categorías de scope 'tareas')
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// TODO: Import from categories API when available
// For now, using a simplified interface
interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  scope: string;
}

interface CategoryPickerProps {
  value: string;
  onChange: (categoryId: string) => void;
  error?: string;
}

export const CategoryPicker: React.FC<CategoryPickerProps> = ({ value, onChange, error }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (value && categories.length > 0) {
      const category = categories.find((c) => c.id === value);
      setSelectedCategory(category || null);
    }
  }, [value, categories]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const data = await getCategories({ scope: 'tareas' });

      // Mock data for now
      const mockCategories: Category[] = [
        { id: '1', name: 'Trabajo', icon: 'briefcase', color: '#2196F3', scope: 'tareas' },
        { id: '2', name: 'Personal', icon: 'person', color: '#4CAF50', scope: 'tareas' },
        { id: '3', name: 'Casa', icon: 'home', color: '#FF9800', scope: 'tareas' },
        { id: '4', name: 'Estudio', icon: 'school', color: '#9C27B0', scope: 'tareas' },
      ];

      setCategories(mockCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

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
      <View style={[styles.categoryIcon, { backgroundColor: item.color || '#CCC' }]}>
        <Ionicons name={(item.icon as any) || 'folder'} size={20} color="#FFF" />
      </View>
      <Text style={styles.categoryName}>{item.name}</Text>
      {value === item.id && (
        <Ionicons name="checkmark-circle" size={24} color="#2196F3" style={styles.checkmark} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Categoría</Text>
      <TouchableOpacity
        style={[styles.selector, error && styles.selectorError]}
        onPress={() => setModalVisible(true)}
      >
        {selectedCategory ? (
          <View style={styles.selectedContent}>
            <View
              style={[styles.selectedIcon, { backgroundColor: selectedCategory.color || '#CCC' }]}
            >
              <Ionicons name={(selectedCategory.icon as any) || 'folder'} size={20} color="#FFF" />
            </View>
            <Text style={styles.selectedText}>{selectedCategory.name}</Text>
          </View>
        ) : (
          <Text style={styles.placeholder}>Seleccionar categoría</Text>
        )}
        <Ionicons name="chevron-down" size={20} color="#666" />
      </TouchableOpacity>
      {error && <Text style={styles.error}>{error}</Text>}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Categoría</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2196F3" />
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
  selectedText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  placeholder: {
    fontSize: 15,
    color: '#999',
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
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
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
    flex: 1,
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  checkmark: {
    marginLeft: 8,
  },
});
