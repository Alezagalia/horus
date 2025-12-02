/**
 * Categories Page
 * Sprint 11 - US-102
 */

import { useState, useMemo } from 'react';
import { Toaster } from 'react-hot-toast';
import { Scope, SCOPE_LABELS, SCOPE_ICONS, type CreateCategoryDTO } from '@horus/shared';
import type { Category } from '@horus/shared';
import { CategoryCard } from '@/components/categories/CategoryCard';
import { CategoryModal } from '@/components/categories/CategoryModal';
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useSetDefaultCategory,
} from '@/hooks/useCategories';

export function CategoriesPage() {
  // State
  const [activeScope, setActiveScope] = useState<Scope>(Scope.HABITOS);
  const [showInactive, setShowInactive] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [settingDefaultCategory, setSettingDefaultCategory] = useState<Category | null>(null);

  // Fetch categories for active scope
  const { data: categories = [], isLoading } = useCategories({ scope: activeScope });

  // Mutations
  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();
  const deleteCategoryMutation = useDeleteCategory();
  const setDefaultCategoryMutation = useSetDefaultCategory();

  // Filtered categories
  const filteredCategories = useMemo(() => {
    let filtered = categories;

    // Filter by active/inactive
    if (!showInactive) {
      filtered = filtered.filter((c) => c.isActive);
    }

    // Sort alphabetically
    return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
  }, [categories, showInactive]);

  // Handlers
  const handleCreateCategory = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleDeleteCategory = (category: Category) => {
    setDeletingCategory(category);
  };

  const confirmDelete = () => {
    if (deletingCategory) {
      deleteCategoryMutation.mutate(deletingCategory.id, {
        onSuccess: () => {
          setDeletingCategory(null);
        },
      });
    }
  };

  const handleSetDefault = (category: Category) => {
    setSettingDefaultCategory(category);
  };

  const confirmSetDefault = () => {
    if (settingDefaultCategory) {
      setDefaultCategoryMutation.mutate(settingDefaultCategory.id, {
        onSuccess: () => {
          setSettingDefaultCategory(null);
        },
      });
    }
  };

  const handleSubmitForm = (data: CreateCategoryDTO) => {
    if (editingCategory) {
      // Edit
      updateCategoryMutation.mutate(
        {
          id: editingCategory.id,
          data: {
            name: data.name,
            icon: data.icon,
            color: data.color,
          },
        },
        {
          onSuccess: () => {
            setIsModalOpen(false);
            setEditingCategory(null);
          },
        }
      );
    } else {
      // Create
      createCategoryMutation.mutate(data, {
        onSuccess: () => {
          setIsModalOpen(false);
        },
      });
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando categorías...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Toaster position="top-right" />

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Categorías</h1>
            <p className="text-gray-600 mt-1">Organiza tus hábitos, tareas, eventos y gastos</p>
          </div>
          <button
            onClick={handleCreateCategory}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Nueva Categoría
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-gray-200">
          {(Object.values(Scope) as Scope[]).map((scope) => (
            <button
              key={scope}
              onClick={() => setActiveScope(scope)}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeScope === scope
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="mr-2">{SCOPE_ICONS[scope]}</span>
              {SCOPE_LABELS[scope]}
            </button>
          ))}
        </div>
      </div>

      {/* Show Inactive Toggle */}
      <div className="mb-4 flex items-center gap-2">
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          />
          Mostrar inactivas
        </label>
      </div>

      {/* Categories List */}
      {filteredCategories.length === 0 ? (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-8">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">{SCOPE_ICONS[activeScope]}</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No hay categorías</h2>
            <p className="text-gray-600 mb-4">
              {showInactive
                ? `No tienes categorías de ${SCOPE_LABELS[activeScope].toLowerCase()}`
                : `No tienes categorías activas de ${SCOPE_LABELS[activeScope].toLowerCase()}`}
            </p>
            <button
              onClick={handleCreateCategory}
              className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
            >
              Crear primera categoría
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCategories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onEdit={handleEditCategory}
              onDelete={handleDeleteCategory}
              onSetDefault={handleSetDefault}
            />
          ))}
        </div>
      )}

      {/* Category Modal */}
      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCategory(null);
        }}
        onSubmit={handleSubmitForm}
        scope={activeScope}
        editingCategory={editingCategory}
      />

      {/* Delete Confirmation Modal */}
      {deletingCategory && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setDeletingCategory(null)}
          />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Eliminar categoría</h3>
              <p className="text-gray-600 mb-4">
                ¿Estás seguro de que deseas eliminar la categoría "{deletingCategory.name}"?
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Si tiene hábitos/tareas asociados, se desactivará en lugar de eliminarse.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeletingCategory(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Set Default Confirmation Modal */}
      {settingDefaultCategory && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setSettingDefaultCategory(null)}
          />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Marcar como predeterminada
              </h3>
              <p className="text-gray-600 mb-4">
                ¿Deseas marcar "{settingDefaultCategory.name}" como categoría predeterminada?
              </p>
              {categories.find((c) => c.isDefault && c.scope === activeScope) && (
                <p className="text-sm text-gray-500 mb-4">
                  Esto reemplazará la categoría predeterminada actual.
                </p>
              )}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setSettingDefaultCategory(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmSetDefault}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
