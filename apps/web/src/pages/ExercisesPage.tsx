/**
 * Exercises Page
 * Sprint 14 - US-137
 */

import { useState, useMemo } from 'react';
import { Toaster } from 'react-hot-toast';
import { type MuscleGroup, type CreateExerciseDTO } from '@horus/shared';
import type { ExerciseWithStats } from '@horus/shared';
import {
  useExercises,
  useCreateExercise,
  useUpdateExercise,
  useDeleteExercise,
} from '@/hooks/useExercises';
import { ExerciseFormModal } from '@/components/exercises/ExerciseFormModal';

const MUSCLE_GROUPS: { value: MuscleGroup; label: string }[] = [
  { value: 'pecho', label: 'Pecho' },
  { value: 'espalda', label: 'Espalda' },
  { value: 'piernas', label: 'Piernas' },
  { value: 'hombros', label: 'Hombros' },
  { value: 'brazos', label: 'Brazos' },
  { value: 'core', label: 'Core' },
  { value: 'cardio', label: 'Cardio' },
  { value: 'otro', label: 'Otro' },
];

export function ExercisesPage() {
  // State
  const [search, setSearch] = useState('');
  const [muscleGroupFilter, setMuscleGroupFilter] = useState<MuscleGroup | ''>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<ExerciseWithStats | null>(null);
  const [deletingExercise, setDeletingExercise] = useState<ExerciseWithStats | null>(null);

  // Fetch exercises
  const { data: exercises = [], isLoading } = useExercises();

  // Mutations
  const createExerciseMutation = useCreateExercise();
  const updateExerciseMutation = useUpdateExercise();
  const deleteExerciseMutation = useDeleteExercise();

  // Filtered exercises
  const filteredExercises = useMemo(() => {
    let filtered = exercises;

    // Filter by search
    if (search) {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter((e) => e.name.toLowerCase().includes(lowerSearch));
    }

    // Filter by muscle group
    if (muscleGroupFilter) {
      filtered = filtered.filter((e) => e.muscleGroup === muscleGroupFilter);
    }

    // Sort alphabetically
    return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
  }, [exercises, search, muscleGroupFilter]);

  // Handlers
  const handleCreateExercise = () => {
    setEditingExercise(null);
    setIsModalOpen(true);
  };

  const handleEditExercise = (exercise: ExerciseWithStats) => {
    setEditingExercise(exercise);
    setIsModalOpen(true);
  };

  const handleDeleteExercise = (exercise: ExerciseWithStats) => {
    setDeletingExercise(exercise);
  };

  const confirmDelete = () => {
    if (deletingExercise) {
      deleteExerciseMutation.mutate(deletingExercise.id, {
        onSuccess: () => {
          setDeletingExercise(null);
        },
      });
    }
  };

  const handleSubmitForm = (data: CreateExerciseDTO) => {
    if (editingExercise) {
      // Edit
      updateExerciseMutation.mutate(
        {
          id: editingExercise.id,
          data,
        },
        {
          onSuccess: () => {
            setIsModalOpen(false);
            setEditingExercise(null);
          },
        }
      );
    } else {
      // Create
      createExerciseMutation.mutate(data, {
        onSuccess: () => {
          setIsModalOpen(false);
        },
      });
    }
  };

  const getMuscleGroupLabel = (muscleGroup: MuscleGroup | null): string => {
    if (!muscleGroup) return '-';
    return MUSCLE_GROUPS.find((g) => g.value === muscleGroup)?.label || muscleGroup;
  };

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return 'Nunca';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando ejercicios...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Ejercicios</h1>
            <p className="text-gray-600 mt-1">Gestiona tu biblioteca de ejercicios</p>
          </div>
          <button
            onClick={handleCreateExercise}
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
            Nuevo Ejercicio
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar ejercicios..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Muscle Group Filter */}
          <select
            value={muscleGroupFilter}
            onChange={(e) => setMuscleGroupFilter(e.target.value as MuscleGroup | '')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">Todos los grupos musculares</option>
            {MUSCLE_GROUPS.map((group) => (
              <option key={group.value} value={group.value}>
                {group.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Total Ejercicios</p>
          <p className="text-2xl font-bold text-gray-900">{exercises.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Filtrados</p>
          <p className="text-2xl font-bold text-indigo-600">{filteredExercises.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Grupos Musculares</p>
          <p className="text-2xl font-bold text-gray-900">{MUSCLE_GROUPS.length}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {filteredExercises.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay ejercicios</h3>
            <p className="mt-1 text-sm text-gray-500">
              {search || muscleGroupFilter
                ? 'Prueba ajustando los filtros'
                : 'Comienza creando un nuevo ejercicio'}
            </p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Grupo Muscular
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usado en Rutinas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Última Vez
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredExercises.map((exercise) => (
                <tr key={exercise.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{exercise.name}</div>
                    {exercise.notes && (
                      <div className="text-xs text-gray-500 mt-1 truncate max-w-xs">
                        {exercise.notes}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      {getMuscleGroupLabel(exercise.muscleGroup)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {exercise.usedInRoutines}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(exercise.lastUsed)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEditExercise(exercise)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteExercise(exercise)}
                      className="text-red-600 hover:text-red-900"
                      disabled={exercise.usedInRoutines > 0}
                      title={
                        exercise.usedInRoutines > 0
                          ? 'No se puede eliminar: usado en rutinas'
                          : 'Eliminar ejercicio'
                      }
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Exercise Form Modal */}
      {isModalOpen && (
        <ExerciseFormModal
          exercise={editingExercise}
          onClose={() => {
            setIsModalOpen(false);
            setEditingExercise(null);
          }}
          onSubmit={handleSubmitForm}
          isLoading={createExerciseMutation.isPending || updateExerciseMutation.isPending}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingExercise && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Eliminar Ejercicio</h3>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro que deseas eliminar el ejercicio &quot;{deletingExercise.name}&quot;?
              Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeletingExercise(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                disabled={deleteExerciseMutation.isPending}
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                disabled={deleteExerciseMutation.isPending}
              >
                {deleteExerciseMutation.isPending ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
