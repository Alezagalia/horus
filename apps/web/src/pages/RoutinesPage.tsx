/**
 * Routines Page
 * Sprint 14 - US-137
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import type { RoutineSummary } from '@horus/shared';
import { useRoutines, useDeleteRoutine, useDuplicateRoutine } from '@/hooks/useRoutines';

export function RoutinesPage() {
  const navigate = useNavigate();
  const [deletingRoutine, setDeletingRoutine] = useState<RoutineSummary | null>(null);

  // Fetch routines
  const { data: routines = [], isLoading } = useRoutines();

  // Mutations
  const deleteRoutineMutation = useDeleteRoutine();
  const duplicateRoutineMutation = useDuplicateRoutine();

  // Handlers
  const handleCreateRoutine = () => {
    navigate('/routines/new');
  };

  const handleRoutineClick = (routineId: string) => {
    navigate(`/routines/${routineId}`);
  };

  const handleEditRoutine = (e: React.MouseEvent, routineId: string) => {
    e.stopPropagation();
    navigate(`/routines/${routineId}/edit`);
  };

  const handleDuplicateRoutine = (e: React.MouseEvent, routineId: string) => {
    e.stopPropagation();
    duplicateRoutineMutation.mutate(routineId);
  };

  const handleDeleteRoutine = (e: React.MouseEvent, routine: RoutineSummary) => {
    e.stopPropagation();
    setDeletingRoutine(routine);
  };

  const confirmDelete = () => {
    if (deletingRoutine) {
      deleteRoutineMutation.mutate(deletingRoutine.id, {
        onSuccess: () => {
          setDeletingRoutine(null);
        },
      });
    }
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
          <p className="text-gray-600">Cargando rutinas...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Rutinas</h1>
            <p className="text-gray-600 mt-1">Crea y gestiona tus rutinas de entrenamiento</p>
          </div>
          <button
            onClick={handleCreateRoutine}
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
            Nueva Rutina
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Total Rutinas</p>
          <p className="text-2xl font-bold text-gray-900">{routines.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Ejecutadas este mes</p>
          <p className="text-2xl font-bold text-indigo-600">
            {routines.reduce((sum, r) => sum + r.timesExecuted, 0)}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Ejercicios Totales</p>
          <p className="text-2xl font-bold text-gray-900">
            {routines.reduce((sum, r) => sum + r.exerciseCount, 0)}
          </p>
        </div>
      </div>

      {/* Routines Grid */}
      {routines.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
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
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay rutinas</h3>
          <p className="mt-1 text-sm text-gray-500">Comienza creando una nueva rutina</p>
          <button
            onClick={handleCreateRoutine}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Crear Primera Rutina
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {routines.map((routine) => (
            <div
              key={routine.id}
              onClick={() => handleRoutineClick(routine.id)}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer group"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                  {routine.name}
                </h3>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => handleEditRoutine(e, routine.id)}
                    className="p-1 text-gray-400 hover:text-indigo-600"
                    title="Editar"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => handleDuplicateRoutine(e, routine.id)}
                    className="p-1 text-gray-400 hover:text-green-600"
                    title="Duplicar"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => handleDeleteRoutine(e, routine)}
                    className="p-1 text-gray-400 hover:text-red-600"
                    title="Eliminar"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Description */}
              {routine.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{routine.description}</p>
              )}

              {/* Stats */}
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                  <span>{routine.exerciseCount} ejercicios</span>
                </div>
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  <span>{routine.timesExecuted} veces</span>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-gray-200 text-xs text-gray-500">
                Última vez: {formatDate(routine.lastExecuted)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingRoutine && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Eliminar Rutina</h3>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro que deseas eliminar la rutina &quot;{deletingRoutine.name}&quot;? Esta
              acción no se puede deshacer.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeletingRoutine(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                disabled={deleteRoutineMutation.isPending}
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                disabled={deleteRoutineMutation.isPending}
              >
                {deleteRoutineMutation.isPending ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
