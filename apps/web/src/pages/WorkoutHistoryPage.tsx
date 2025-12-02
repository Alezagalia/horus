/**
 * Workout History Page
 * Sprint 14 - US-139
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useWorkouts } from '@/hooks/useWorkoutHistory';
import { useRoutines } from '@/hooks/useRoutines';

export function WorkoutHistoryPage() {
  const navigate = useNavigate();

  // State
  const [daysFilter, setDaysFilter] = useState<number | undefined>(30);
  const [routineFilter, setRoutineFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 20;

  // Fetch workouts
  const { data: workoutsData, isLoading } = useWorkouts({
    days: daysFilter,
    routineId: routineFilter || undefined,
    page: currentPage,
    limit,
  });

  // Fetch routines for filter
  const { data: routines = [] } = useRoutines();

  const workouts = workoutsData?.workouts || [];
  const pagination = workoutsData?.pagination;

  // Handlers
  const handleWorkoutClick = (workoutId: string) => {
    navigate(`/workouts/${workoutId}`);
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
      day: '2-digit',
      month: 'short',
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
          <p className="text-gray-600">Cargando historial...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Toaster position="top-right" />

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Historial de Entrenamientos</h1>
        <p className="text-gray-600 mt-1">Revisa tus entrenamientos completados</p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        {/* Days filter */}
        <select
          value={daysFilter || ''}
          onChange={(e) => {
            setDaysFilter(e.target.value ? Number(e.target.value) : undefined);
            setCurrentPage(1);
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          <option value="">Todos los tiempos</option>
          <option value="7">Últimos 7 días</option>
          <option value="30">Últimos 30 días</option>
          <option value="90">Últimos 90 días</option>
        </select>

        {/* Routine filter */}
        <select
          value={routineFilter}
          onChange={(e) => {
            setRoutineFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          <option value="">Todas las rutinas</option>
          {routines.map((routine) => (
            <option key={routine.id} value={routine.id}>
              {routine.name}
            </option>
          ))}
        </select>
      </div>

      {/* Stats Summary */}
      {pagination && (
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Total Entrenamientos</p>
            <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Volumen Total</p>
            <p className="text-2xl font-bold text-indigo-600">
              {workouts.reduce((sum, w) => sum + (w.totalVolume || 0), 0).toLocaleString()} kg
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Series Totales</p>
            <p className="text-2xl font-bold text-gray-900">
              {workouts.reduce((sum, w) => sum + w.totalSets, 0)}
            </p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {workouts.length === 0 ? (
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
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay entrenamientos</h3>
            <p className="mt-1 text-sm text-gray-500">
              {daysFilter || routineFilter
                ? 'Prueba ajustando los filtros'
                : 'Comienza un nuevo entrenamiento'}
            </p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rutina
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duración
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ejercicios
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Series
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Volumen
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {workouts.map((workout) => (
                <tr
                  key={workout.id}
                  onClick={() => handleWorkoutClick(workout.id)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(workout.startTime)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {workout.routineName || 'Entrenamiento libre'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDuration(workout.duration)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {workout.exercisesCompleted}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {workout.totalSets}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
                    {workout.totalVolume?.toLocaleString() || 0} kg
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.total > limit && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Mostrando {(currentPage - 1) * limit + 1} a{' '}
            {Math.min(currentPage * limit, pagination.total)} de {pagination.total} entrenamientos
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <button
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={currentPage * limit >= pagination.total}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
