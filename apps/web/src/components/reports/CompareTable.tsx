/**
 * Reports - Compare Table
 * F-07 - Reportes y Tendencias
 * Sprint 15 - US-147
 */

import { useMemo, useState } from 'react';
import type { ComparableDimension } from '@horus/shared';
import { useCompare } from '@/hooks/useAnalytics';
import { rangeForPreset } from '@/hooks/useAnalyticsRange';

const DIMENSION_LABELS: Record<ComparableDimension, string> = {
  'habits.completions': 'Hábitos cumplidos',
  'tasks.completed': 'Tareas completadas',
  'finance.expense': 'Gasto',
  'finance.income': 'Ingreso',
  'workouts.completed': 'Workouts',
};

type ComparePresetId = 'weekVsWeek' | 'monthVsMonth' | 'yearVsYear' | 'custom';

interface PeriodPair {
  currentFrom: string;
  currentTo: string;
  previousFrom: string;
  previousTo: string;
}

function shiftDays(iso: string, delta: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + delta);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

function presetToPair(preset: ComparePresetId): PeriodPair {
  if (preset === 'weekVsWeek') {
    const { from, to } = rangeForPreset('7d');
    return {
      currentFrom: from,
      currentTo: to,
      previousFrom: shiftDays(from, -7),
      previousTo: shiftDays(to, -7),
    };
  }
  if (preset === 'monthVsMonth') {
    const { from, to } = rangeForPreset('30d');
    return {
      currentFrom: from,
      currentTo: to,
      previousFrom: shiftDays(from, -30),
      previousTo: shiftDays(to, -30),
    };
  }
  // yearVsYear
  const { from, to } = rangeForPreset('thisYear');
  return {
    currentFrom: from,
    currentTo: to,
    previousFrom: shiftDays(from, -365),
    previousTo: shiftDays(to, -365),
  };
}

export function CompareTable() {
  const [preset, setPreset] = useState<ComparePresetId>('weekVsWeek');
  const pair = useMemo(() => (preset === 'custom' ? null : presetToPair(preset)), [preset]);

  const { data, isLoading, isError } = useCompare({
    currentFrom: pair?.currentFrom ?? '',
    currentTo: pair?.currentTo ?? '',
    previousFrom: pair?.previousFrom ?? '',
    previousTo: pair?.previousTo ?? '',
    enabled: pair !== null,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: 'weekVsWeek', label: 'Esta semana vs anterior' },
            { id: 'monthVsMonth', label: 'Este mes vs anterior' },
            { id: 'yearVsYear', label: 'Este año vs anterior' },
          ] as { id: ComparePresetId; label: string }[]
        ).map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPreset(p.id)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              preset === p.id
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {isLoading && <div className="h-48 rounded-xl bg-gray-100 animate-pulse" />}

      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          No se pudo cargar la comparación.
        </div>
      )}

      {!isLoading && !isError && data && (
        <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Métrica</th>
                <th className="text-right px-4 py-3 font-semibold">Actual</th>
                <th className="text-right px-4 py-3 font-semibold">Anterior</th>
                <th className="text-right px-4 py-3 font-semibold">Δ</th>
                <th className="text-right px-4 py-3 font-semibold">Δ %</th>
              </tr>
            </thead>
            <tbody>
              {(Object.keys(data.metrics) as ComparableDimension[]).map((dim) => {
                const m = data.metrics[dim];
                const favourable = dim === 'finance.expense' ? m.delta <= 0 : m.delta >= 0;
                const color =
                  m.delta === 0
                    ? 'text-gray-500'
                    : favourable
                      ? 'text-emerald-600'
                      : 'text-red-600';
                return (
                  <tr key={dim} className="border-t border-gray-100">
                    <td className="px-4 py-3 font-medium text-gray-900">{DIMENSION_LABELS[dim]}</td>
                    <td className="px-4 py-3 text-right text-gray-700">
                      {m.current.toLocaleString('es-AR')}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">
                      {m.previous.toLocaleString('es-AR')}
                    </td>
                    <td className={`px-4 py-3 text-right font-semibold ${color}`}>
                      {m.delta > 0 ? '+' : ''}
                      {m.delta.toLocaleString('es-AR')}
                    </td>
                    <td className={`px-4 py-3 text-right font-semibold ${color}`}>
                      {m.deltaPercentage === null
                        ? '—'
                        : `${m.deltaPercentage > 0 ? '+' : ''}${m.deltaPercentage}%`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
