/**
 * Workout Stats Page
 * Sprint 14 - US-139
 */

import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useOverviewStats, useExerciseStats } from '@/hooks/useWorkoutStats';
import { useExercises } from '@/hooks/useExercises';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#f97316'];

export function WorkoutStatsPage() {
  // State
  const [activeTab, setActiveTab] = useState<'general' | 'exercise'>('general');
  const [periodDays, setPeriodDays] = useState(30);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('');

  // Fetch data
  const { data: overviewStats, isLoading: isLoadingOverview } = useOverviewStats(periodDays);
  const { data: exerciseStats, isLoading: isLoadingExercise } = useExerciseStats(
    selectedExerciseId,
    periodDays
  );
  const { data: exercises = [] } = useExercises();

  const isLoading = activeTab === 'general' ? isLoadingOverview : isLoadingExercise;

  // Format helpers
  const formatFrequency = (freq: number): string => {
    return `${freq.toFixed(1)}x/semana`;
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  // Loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Toaster position="top-right" />

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Estadísticas de Entrenamiento</h1>
        <p className="text-gray-600 mt-1">Analiza tu progreso y rendimiento</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('general')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'general'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Vista General
          </button>
          <button
            onClick={() => setActiveTab('exercise')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'exercise'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Por Ejercicio
          </button>
        </nav>
      </div>

      {/* Period selector */}
      <div className="mb-6">
        <select
          value={periodDays}
          onChange={(e) => setPeriodDays(Number(e.target.value))}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          <option value={7}>Últimos 7 días</option>
          <option value={30}>Últimos 30 días</option>
          <option value={90}>Últimos 90 días</option>
          <option value={365}>Último año</option>
        </select>
      </div>

      {/* General Tab */}
      {activeTab === 'general' && overviewStats && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-600">Entrenamientos</p>
              <p className="text-2xl font-bold text-gray-900">{overviewStats.workouts.completed}</p>
              <p className="text-xs text-gray-500 mt-1">
                {formatFrequency(overviewStats.workouts.frequency)}
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-600">Duración Promedio</p>
              <p className="text-2xl font-bold text-indigo-600">
                {formatDuration(overviewStats.workouts.avgDuration)}
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-600">Volumen Total</p>
              <p className="text-2xl font-bold text-gray-900">
                {overviewStats.volume.total.toLocaleString()} kg
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Promedio: {Math.round(overviewStats.volume.avgPerWorkout).toLocaleString()}{' '}
                kg/workout
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-600">Series Totales</p>
              <p className="text-2xl font-bold text-indigo-600">
                {overviewStats.exercises.totalSets}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {overviewStats.exercises.uniqueExercises} ejercicios únicos
              </p>
            </div>
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-2 gap-6">
            {/* Weekly Frequency Chart */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Volumen Semanal</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={overviewStats.weeklyFrequency}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="totalVolume" fill="#6366f1" name="Volumen (kg)" />
                  <Bar dataKey="workouts" fill="#10b981" name="Entrenamientos" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Muscle Group Distribution */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribución Muscular</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={overviewStats.muscleGroupDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.muscleGroup} (${entry.percentage}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {overviewStats.muscleGroupDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Exercises Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Ejercicios Más Realizados</h3>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Ejercicio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Veces Realizado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Volumen Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {overviewStats.topExercises.map((exercise) => (
                  <tr key={exercise.exerciseId}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {exercise.exerciseName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {exercise.count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
                      {exercise.totalVolume.toLocaleString()} kg
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Exercise Tab */}
      {activeTab === 'exercise' && (
        <div className="space-y-6">
          {/* Exercise Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selecciona un ejercicio
            </label>
            <select
              value={selectedExerciseId}
              onChange={(e) => setSelectedExerciseId(e.target.value)}
              className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">-- Selecciona un ejercicio --</option>
              {exercises.map((exercise) => (
                <option key={exercise.id} value={exercise.id}>
                  {exercise.name} {exercise.muscleGroup && `(${exercise.muscleGroup})`}
                </option>
              ))}
            </select>
          </div>

          {/* Exercise Stats */}
          {exerciseStats && selectedExerciseId && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <p className="text-sm text-gray-600">Veces Realizado</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {exerciseStats.executions.timesExecuted}
                  </p>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <p className="text-sm text-gray-600">Peso Máximo</p>
                  <p className="text-2xl font-bold text-indigo-600">
                    {exerciseStats.loadProgress.maxWeightPeriod} kg
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Record: {exerciseStats.loadProgress.maxWeightAllTime} kg
                  </p>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <p className="text-sm text-gray-600">Mejora</p>
                  <p className="text-2xl font-bold text-green-600">
                    +{exerciseStats.loadProgress.improvement.toFixed(1)} kg
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    +{exerciseStats.loadProgress.improvementPercentage.toFixed(1)}%
                  </p>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <p className="text-sm text-gray-600">Volumen Total</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {exerciseStats.volume.totalVolume.toLocaleString()} kg
                  </p>
                </div>
              </div>

              {/* Weight Evolution Chart */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Evolución de Peso Máximo
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={exerciseStats.chart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(date) =>
                        new Date(date).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                        })
                      }
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(date) => new Date(date).toLocaleDateString('es-ES')}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="maxWeight"
                      stroke="#6366f1"
                      strokeWidth={2}
                      name="Peso Máximo (kg)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Volume Chart */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Volumen por Sesión</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={exerciseStats.chart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(date) =>
                        new Date(date).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                        })
                      }
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(date) => new Date(date).toLocaleDateString('es-ES')}
                    />
                    <Legend />
                    <Bar dataKey="totalVolume" fill="#10b981" name="Volumen (kg)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Last Workout */}
              {exerciseStats.lastWorkout && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Último Entrenamiento</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {new Date(exerciseStats.lastWorkout.date).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {exerciseStats.lastWorkout.sets.map((set, index) => (
                      <div key={index} className="bg-gray-50 rounded p-3 text-center">
                        <p className="text-xs text-gray-500">Serie {index + 1}</p>
                        <p className="text-lg font-bold text-gray-900">
                          {set.reps} x {set.weight} kg
                        </p>
                      </div>
                    ))}
                  </div>
                  {exerciseStats.lastWorkout.notes && (
                    <p className="mt-4 text-sm text-gray-600 italic">
                      Notas: {exerciseStats.lastWorkout.notes}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* No exercise selected */}
          {!selectedExerciseId && (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
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
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Selecciona un ejercicio</h3>
              <p className="mt-1 text-sm text-gray-500">
                Elige un ejercicio del menú desplegable para ver sus estadísticas
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
