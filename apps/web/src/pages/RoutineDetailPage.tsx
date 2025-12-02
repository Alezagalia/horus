/**
 * Routine Detail Page
 * Sprint 14 - US-137
 */

import { useNavigate, useParams } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useRoutine } from '@/hooks/useRoutines';

export function RoutineDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Fetch routine detail
  const { data: routine, isLoading, isError } = useRoutine(id);

  const handleEdit = () => {
    navigate(`/routines/${id}/edit`);
  };

  const handleBack = () => {
    navigate('/routines');
  };

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return 'Nunca';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando rutina...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (isError || !routine) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-red-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">Rutina no encontrada</h3>
        <p className="mt-1 text-sm text-gray-500">La rutina que buscas no existe</p>
        <button
          onClick={handleBack}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Volver a Rutinas
        </button>
      </div>
    );
  }

  return (
    <div>
      <Toaster position="top-right" />

      {/* Header */}
      <div className="mb-6">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Volver a Rutinas
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{routine.name}</h1>
            {routine.description && (
              <p className="text-gray-600 mt-2 max-w-2xl">{routine.description}</p>
            )}
          </div>
          <button
            onClick={handleEdit}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Editar Rutina
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Ejercicios</p>
          <p className="text-2xl font-bold text-gray-900">{routine.exercises.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Veces Ejecutada</p>
          <p className="text-2xl font-bold text-indigo-600">{routine.stats.timesExecuted}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Última Ejecución</p>
          <p className="text-lg font-bold text-gray-900">
            {routine.stats.lastExecuted
              ? new Date(routine.stats.lastExecuted).toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: 'short',
                })
              : 'Nunca'}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Duración Promedio</p>
          <p className="text-lg font-bold text-gray-900">
            {routine.stats.avgDuration ? `${Math.round(routine.stats.avgDuration)} min` : '-'}
          </p>
        </div>
      </div>

      {/* Exercises List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Ejercicios de la Rutina</h2>
        </div>

        {routine.exercises.length === 0 ? (
          <div className="px-6 py-12 text-center">
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
            <h3 className="mt-2 text-sm font-medium text-gray-900">Sin ejercicios</h3>
            <p className="mt-1 text-sm text-gray-500">
              Esta rutina no tiene ejercicios configurados
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {routine.exercises.map((exercise, index) => (
              <div key={exercise.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-start gap-4">
                  {/* Order number */}
                  <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>

                  {/* Exercise info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{exercise.exerciseName}</h3>
                        {exercise.muscleGroup && (
                          <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                            {exercise.muscleGroup}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Targets */}
                    <div className="mt-2 flex flex-wrap gap-4 text-sm">
                      {exercise.targetSets !== null && (
                        <div className="flex items-center gap-1 text-gray-600">
                          <svg
                            className="w-4 h-4"
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
                          <span>
                            <strong>{exercise.targetSets}</strong> series
                          </span>
                        </div>
                      )}

                      {exercise.targetReps !== null && (
                        <div className="flex items-center gap-1 text-gray-600">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                          </svg>
                          <span>
                            <strong>{exercise.targetReps}</strong> reps
                          </span>
                        </div>
                      )}

                      {exercise.targetWeight !== null && (
                        <div className="flex items-center gap-1 text-gray-600">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
                            />
                          </svg>
                          <span>
                            <strong>{exercise.targetWeight}</strong> kg
                          </span>
                        </div>
                      )}

                      {exercise.restTime !== null && (
                        <div className="flex items-center gap-1 text-gray-600">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span>
                            <strong>{exercise.restTime}</strong>s descanso
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Notes */}
                    {exercise.notes && (
                      <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        {exercise.notes}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="mt-6 text-sm text-gray-500 text-center">
        Creada el {formatDate(routine.createdAt)}
      </div>
    </div>
  );
}
