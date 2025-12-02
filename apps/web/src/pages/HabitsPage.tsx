/**
 * Habits Page - Full List & Management
 * Sprint 11 - US-099
 * Connected to backend API
 */

import { useState, useMemo } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { SearchBar } from '@/components/habits/SearchBar';
import { CategoryFilter } from '@/components/habits/CategoryFilter';
import { HabitListItem } from '@/components/habits/HabitListItem';
import { HabitFormModal } from '@/components/habits/HabitFormModal';
import { useHabits, useCreateHabit, useUpdateHabit, useDeleteHabit, transformHabitFromAPI } from '@/hooks/useHabits';
import { useCategories } from '@/hooks/useCategories';
import { Scope } from '@horus/shared';
import type { Habit, HabitFormData } from '@/types/habits';

type SortOption = 'name' | 'streak' | 'createdAt';

export function HabitsPage() {
  // API queries
  const { data: habitsFromAPI, isLoading: isLoadingHabits, error: habitsError } = useHabits();
  const { data: categoriesFromAPI, isLoading: isLoadingCategories } = useCategories({ scope: Scope.HABITOS });

  // Mutations
  const createHabitMutation = useCreateHabit();
  const updateHabitMutation = useUpdateHabit();
  const deleteHabitMutation = useDeleteHabit();

  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('createdAt');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  // Transform API data to frontend format
  const habits: Habit[] = useMemo(() => {
    if (!habitsFromAPI) return [];
    return habitsFromAPI.map(transformHabitFromAPI);
  }, [habitsFromAPI]);

  const categories = useMemo(() => {
    if (!categoriesFromAPI) return [];
    return categoriesFromAPI.map((c) => ({
      id: c.id,
      name: c.name,
      icon: c.icon || undefined,
      color: c.color || undefined,
    }));
  }, [categoriesFromAPI]);

  // Filtered and sorted habits
  const filteredHabits = useMemo(() => {
    let filtered = habits;

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (h) =>
          h.name.toLowerCase().includes(query) ||
          h.description?.toLowerCase().includes(query) ||
          h.categoryName.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (selectedCategoryId) {
      filtered = filtered.filter((h) => h.categoryId === selectedCategoryId);
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'streak':
          return b.currentStreak - a.currentStreak;
        case 'createdAt':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });

    // Active habits first
    return sorted.sort((a, b) => {
      if (a.isActive === b.isActive) return 0;
      return a.isActive ? -1 : 1;
    });
  }, [habits, searchQuery, selectedCategoryId, sortBy]);

  const handleCreateHabit = () => {
    setEditingHabit(null);
    setIsModalOpen(true);
  };

  const handleEditHabit = (habitId: string) => {
    const habit = habits.find((h) => h.id === habitId);
    if (habit) {
      setEditingHabit(habit);
      setIsModalOpen(true);
    }
  };

  const handleToggleActive = async (habitId: string) => {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;

    if (habit.isActive) {
      // Desactivar = eliminar (soft delete)
      deleteHabitMutation.mutate(habitId, {
        onSuccess: () => {
          toast.success(`${habit.name} desactivado`, { icon: '⏸️' });
        },
      });
    } else {
      // Reactivar
      toast.info('Para reactivar un hábito, usa la opción de edición');
    }
  };

  const handleSubmitForm = async (data: HabitFormData) => {
    if (editingHabit) {
      // Update existing habit
      updateHabitMutation.mutate(
        { id: editingHabit.id, data },
        {
          onSuccess: () => {
            setIsModalOpen(false);
            setEditingHabit(null);
          },
        }
      );
    } else {
      // Create new habit
      createHabitMutation.mutate(data, {
        onSuccess: () => {
          setIsModalOpen(false);
        },
      });
    }
  };

  const activeHabitsCount = habits.filter((h) => h.isActive).length;
  const totalStreak = habits.reduce((sum, h) => sum + h.currentStreak, 0);

  // Loading state
  if (isLoadingHabits || isLoadingCategories) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando hábitos...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (habitsError) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="text-5xl mb-4">😕</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Error al cargar hábitos</h2>
        <p className="text-gray-600">{habitsError.message}</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Mis Hábitos</h1>
            <p className="text-gray-600 mt-1">
              {activeHabitsCount} hábitos activos · {totalStreak} días totales de racha
            </p>
          </div>
          <button
            onClick={handleCreateHabit}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all font-medium shadow-lg shadow-indigo-500/30"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Crear hábito
          </button>
        </div>

        {/* Search & Filters */}
        <div className="space-y-4">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Category Filter */}
            <div className="flex-1">
              <CategoryFilter
                categories={categories}
                selectedCategoryId={selectedCategoryId}
                onCategoryChange={setSelectedCategoryId}
              />
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Ordenar por:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="createdAt">Fecha de creación</option>
                <option value="name">Nombre</option>
                <option value="streak">Racha</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Habits List */}
      {filteredHabits.length === 0 ? (
        <div className="glass-card p-8">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {searchQuery || selectedCategoryId
                ? 'No se encontraron hábitos'
                : 'No tienes hábitos creados'}
            </h2>
            <p className="text-gray-600 mb-4">
              {searchQuery || selectedCategoryId
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'Crea tu primer hábito para comenzar tu rutina'}
            </p>
            {!searchQuery && !selectedCategoryId && (
              <button
                onClick={handleCreateHabit}
                className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
              >
                Crear hábito
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredHabits.map((habit) => (
            <HabitListItem
              key={habit.id}
              habit={habit}
              onEdit={handleEditHabit}
              onToggleActive={handleToggleActive}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <HabitFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingHabit(null);
        }}
        onSubmit={handleSubmitForm}
        categories={categories}
        editingHabit={editingHabit}
        isSubmitting={createHabitMutation.isPending || updateHabitMutation.isPending}
      />
    </div>
  );
}
