/**
 * Reports - Productivity Tab
 * F-07 - Reportes y Tendencias
 * Sprint 15 - US-149
 */

import { useProductivity } from '@/hooks/useAnalytics';
import { ProductivityHeatmap } from './ProductivityHeatmap';
import { ProductivityBars } from './ProductivityBars';

interface ProductivityTabProps {
  from: string;
  to: string;
}

const DAY_NAMES_FULL = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export function ProductivityTab({ from, to }: ProductivityTabProps) {
  const { data, isLoading, isError, refetch } = useProductivity(from, to);

  if (isLoading) return <div className="h-96 rounded-xl bg-gray-100 animate-pulse" />;

  if (isError || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4">
        <p className="text-red-700 font-medium mb-2">No se pudo cargar productividad.</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (data.totalCompleted === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center text-gray-500">
        Sin tareas completadas en este período.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-100 bg-white p-5">
          <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">Total completadas</p>
          <p className="text-2xl font-bold text-gray-900">{data.totalCompleted}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-5">
          <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">Tu mejor día</p>
          <p className="text-2xl font-bold text-gray-900">
            {data.bestDayOfWeek ? DAY_NAMES_FULL[data.bestDayOfWeek.dayOfWeek] : '—'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {data.bestDayOfWeek ? `${data.bestDayOfWeek.completed} tareas` : 'Sin datos'}
          </p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-5">
          <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">Tu mejor hora</p>
          <p className="text-2xl font-bold text-gray-900">
            {data.bestHour ? `${String(data.bestHour.hour).padStart(2, '0')}:00` : '—'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {data.bestHour ? `${data.bestHour.completed} tareas` : 'Sin datos'}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-5">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Mapa día × hora</h4>
        <ProductivityHeatmap data={data} />
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-5">
        <ProductivityBars data={data} />
      </div>
    </div>
  );
}
