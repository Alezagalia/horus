/**
 * Reports - Habits Tab
 * F-07 - Reportes y Tendencias
 * Sprint 15 - US-148
 */

import { useState } from 'react';
import { useHabitsHeatmap } from '@/hooks/useAnalytics';
import { HabitHeatmap } from './HabitHeatmap';

function buildYearOptions(): number[] {
  const current = new Date().getUTCFullYear();
  return [current, current - 1, current - 2, current - 3].filter((y) => y >= 2020);
}

export function HabitsTab() {
  const [year, setYear] = useState<number>(new Date().getUTCFullYear());
  const { data, isLoading, isError, refetch } = useHabitsHeatmap(year);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium text-gray-700">Año:</label>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
        >
          {buildYearOptions().map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {isLoading && <div className="h-40 rounded-xl bg-gray-100 animate-pulse" />}

      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-red-700 font-medium mb-2">No se pudo cargar el heatmap.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700"
          >
            Reintentar
          </button>
        </div>
      )}

      {!isLoading && !isError && data && (
        <>
          <div className="rounded-xl border border-gray-100 bg-white p-6 overflow-x-auto">
            <HabitHeatmap data={data} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-gray-100 bg-white p-5">
              <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">
                Total completitudes
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {data.totalCompletions.toLocaleString('es-AR')}
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white p-5">
              <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">Mejor día</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.bestDay ? `${data.bestDay.completions} hábitos` : '—'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {data.bestDay ? data.bestDay.date : 'Sin actividad'}
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white p-5">
              <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">Días activos</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.days.filter((d) => d.completions > 0).length}
              </p>
              <p className="text-sm text-gray-500 mt-1">de {data.days.length}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
