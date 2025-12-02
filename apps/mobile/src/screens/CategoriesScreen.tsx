/**
 * CategoriesScreen - Complete Implementation
 * Sprint 2 - US-015
 *
 * Main screen for category management with tabs (Hábitos, Tareas, Eventos, Gastos)
 */

import { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Scope, SCOPE_LABELS, type Category, type CreateCategoryDTO } from '@horus/shared';
import {
  getCategories,
  deleteCategory,
  setDefaultCategory,
  createCategory,
  updateCategory,
} from '../api/categories.api';
import { CategoryCard } from '../components/categories/CategoryCard';
import { CategoryBottomSheet } from '../components/categories/CategoryBottomSheet';
import { CategoryFormModal } from '../components/categories/CategoryFormModal';
import { EmptyState } from '../components/common/EmptyState';
import { Toast } from '../components/common/Toast';

export function CategoriesScreen() {
  const [selectedScope, setSelectedScope] = useState<Scope>(Scope.HABITOS);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const queryClient = useQueryClient();

  // React Query for data fetching
  const {
    data: categories = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['categories', selectedScope],
    queryFn: () => getCategories({ scope: selectedScope }),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setToast({ message: 'Categoría eliminada', type: 'success' });
    },
    onError: (error: Error) => {
      const axiosError = error as { response?: { data?: { message?: string } } };
      setToast({
        message: axiosError.response?.data?.message || 'Error al eliminar categoría',
        type: 'error',
      });
    },
  });

  // Set default mutation
  const setDefaultMutation = useMutation({
    mutationFn: setDefaultCategory,
    onSuccess: (_data, categoryId) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      const category = categories.find((c) => c.id === categoryId);
      if (category) {
        setToast({
          message: `"${category.name}" es ahora la categoría default de ${SCOPE_LABELS[category.scope]}`,
          type: 'success',
        });
      }
    },
    onError: (error: Error) => {
      const axiosError = error as { response?: { data?: { message?: string } } };
      setToast({
        message: axiosError.response?.data?.message || 'Error al cambiar categoría default',
        type: 'error',
      });
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setFormModalVisible(false);
      setToast({ message: 'Categoría creada', type: 'success' });
    },
    onError: (error: Error) => {
      const axiosError = error as { response?: { data?: { message?: string } } };
      setToast({
        message: axiosError.response?.data?.message || 'Error al crear categoría',
        type: 'error',
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateCategoryDTO }) => updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setFormModalVisible(false);
      setCategoryToEdit(null);
      setToast({ message: 'Categoría actualizada', type: 'success' });
    },
    onError: (error: Error) => {
      const axiosError = error as { response?: { data?: { message?: string } } };
      setToast({
        message: axiosError.response?.data?.message || 'Error al actualizar categoría',
        type: 'error',
      });
    },
  });

  const handleCategoryPress = (category: Category) => {
    setSelectedCategory(category);
    setBottomSheetVisible(true);
  };

  const handleEdit = (category: Category) => {
    setCategoryToEdit(category);
    setFormModalVisible(true);
    setBottomSheetVisible(false);
  };

  const handleSetDefault = (category: Category) => {
    setDefaultMutation.mutate(category.id);
  };

  const handleDelete = (category: Category) => {
    deleteMutation.mutate(category.id);
  };

  const handleCreateNew = () => {
    setCategoryToEdit(null);
    setFormModalVisible(true);
  };

  const handleFormSubmit = (data: CreateCategoryDTO & { id?: string }) => {
    if (data.id) {
      // Edit mode
      const { id, ...updateData } = data;
      updateMutation.mutate({ id, data: updateData });
    } else {
      // Create mode
      createMutation.mutate(data);
    }
  };

  const handleFormClose = () => {
    setFormModalVisible(false);
    setCategoryToEdit(null);
  };

  const renderCategory = ({ item }: { item: Category }) => (
    <CategoryCard category={item} onPress={handleCategoryPress} />
  );

  const renderEmptyState = () => (
    <EmptyState
      icon="📦"
      title={`No tienes categorías de ${SCOPE_LABELS[selectedScope]}`}
      description="Crea tu primera categoría para empezar a organizar"
      actionLabel="Crear categoría"
      onAction={handleCreateNew}
    />
  );

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Cargando categorías...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabs}>
        {Object.values(Scope).map((scope) => (
          <TouchableOpacity
            key={scope}
            style={[styles.tab, selectedScope === scope && styles.tabActive]}
            onPress={() => setSelectedScope(scope)}
          >
            <Text style={[styles.tabText, selectedScope === scope && styles.tabTextActive]}>
              {SCOPE_LABELS[scope]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Category List */}
      <FlatList
        data={categories}
        renderItem={renderCategory}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        ListEmptyComponent={renderEmptyState}
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={handleCreateNew}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* Bottom Sheet */}
      <CategoryBottomSheet
        category={selectedCategory}
        visible={bottomSheetVisible}
        onClose={() => setBottomSheetVisible(false)}
        onEdit={handleEdit}
        onSetDefault={handleSetDefault}
        onDelete={handleDelete}
        currentDefault={categories.find((c) => c.isDefault && c.scope === selectedCategory?.scope)}
      />

      {/* Form Modal */}
      <CategoryFormModal
        visible={formModalVisible}
        category={categoryToEdit}
        scope={selectedScope}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          visible={!!toast}
          onHide={() => setToast(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#2196F3',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  tabTextActive: {
    color: '#2196F3',
    fontWeight: '600',
  },
  list: {
    padding: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 28,
    color: '#fff',
    fontWeight: '300',
  },
});
