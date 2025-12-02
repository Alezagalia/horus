/**
 * Workout Detail Page
 * Sprint 14 - US-139
 */

import { useParams, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useWorkout } from '@/hooks/useWorkoutHistory';

export function WorkoutDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Fetch workout
  const { data: workout, isLoading } = useWorkout(id);

  // Handlers
  const handleRepeatRoutine = () => {
    if (workout?.routineId) {
      navigate(`/workouts/execute/${workout.routineId}`);
    }
  };

  const formatDuration = (minutes: number | null): string => {
    if (!minutes) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando entrenamiento...</p>
        </div>
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Entrenamiento no encontrado</p>
      </div>
    );
  }

  return (
    <div>
      <Toaster position="top-right" />

      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/workouts')}
          className="text-indigo-600 hover:text-indigo-700 mb-4 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Volver al historial
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {workout.routineName || 'Entrenamiento Libre'}
            </h1>
            <p className="text-gray-600 mt-1 capitalize">{formatDate(workout.startTime)}</p>
          </div>
          {workout.routineId && (
            <button
              onClick={handleRepeatRoutine}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Repetir Rutina
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Duración</p>
          <p className="text-2xl font-bold text-gray-900">{formatDuration(workout.duration)}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Ejercicios</p>
          <p className="text-2xl font-bold text-indigo-600">{workout.exercises.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Series Totales</p>
          <p className="text-2xl font-bold text-gray-900">{workout.summary?.totalSets || 0}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Volumen Total</p>
          <p className="text-2xl font-bold text-indigo-600">
            {workout.summary?.totalVolume?.toLocaleString() || 0} kg
          </p>
        </div>
      </div>

      {/* Notes */}
      {workout.notes && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm font-medium text-yellow-900 mb-1">Notas del Entrenamiento</p>
          <p className="text-sm text-yellow-800">{workout.notes}</p>
        </div>
      )}

      {/* Personal Records */}
      {workout.summary?.personalRecords && workout.summary.personalRecords.length > 0 && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm font-medium text-green-900 mb-2">
            🏆 Récords Personales ({workout.summary.personalRecords.length})
          </p>
          <div className="space-y-1">
            {workout.summary.personalRecords.map((pr) => (
              <div key={pr.exerciseId} className="text-sm text-green-800">
                <span className="font-medium">{pr.exerciseName}</span>: {pr.newPR} kg (+
                {pr.improvement.toFixed(1)} kg)
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Exercises Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Ejercicios Realizados</h2>
        </div>

        <div className="divide-y divide-gray-200">
          {workout.exercises.map((exercise) => (
            <div key={exercise.id} className="p-6">
              {/* Exercise header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{exercise.exerciseName}</h3>
                  {exercise.muscleGroup && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 mt-1">
                      {exercise.muscleGroup}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Series realizadas</p>
                  <p className="text-xl font-bold text-gray-900">{exercise.sets.length}</p>
                </div>
              </div>

              {/* Sets table */}
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Serie
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Reps
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Peso
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Volumen
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {exercise.sets.map((set) => (
                    <tr key={set.setNumber}>
                      <td className="px-4 py-2 text-sm text-gray-900">{set.setNumber}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{set.reps}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {set.weight} {set.weightUnit || 'kg'}
                      </td>
                      <td className="px-4 py-2 text-sm font-medium text-indigo-600">
                        {(set.reps * set.weight).toFixed(1)} kg
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={3} className="px-4 py-2 text-sm font-medium text-gray-900">
                      Total Volumen
                    </td>
                    <td className="px-4 py-2 text-sm font-bold text-indigo-600">
                      {exercise.sets
                        .reduce((sum, set) => sum + set.reps * set.weight, 0)
                        .toFixed(1)}{' '}
                      kg
                    </td>
                  </tr>
                </tfoot>
              </table>

              {/* Exercise notes */}
              {exercise.notes && (
                <div className="mt-3 text-sm text-gray-600 italic">Notas: {exercise.notes}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
