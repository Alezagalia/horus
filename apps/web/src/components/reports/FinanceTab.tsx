/**
 * Reports - Finance Tab
 * F-07 - Reportes y Tendencias
 * Sprint 15 - US-149
 */

import { useMemo, useState } from 'react';
import { useFinanceTrends } from '@/hooks/useAnalytics';
import { FinanceTrendsChart } from './FinanceTrendsChart';

const MONTH_OPTIONS = [3, 6, 12, 24];

const currency = (n: number): string =>
  n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

export function FinanceTab() {
  const [months, setMonths] = useState<number>(6);
  const { data, isLoading, isError, refetch } = useFinanceTrends(months);

  const topCategories = useMemo(() => {
    if (!data) return [];
    return data.series
      .map((s) => ({
        ...s,
        total: s.points.reduce((acc, p) => acc + p.amount, 0),
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [data]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-sm font-medium text-gray-700">Período:</label>
        <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
          {MONTH_OPTIONS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMonths(m)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg ${
                months === m
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {m} meses
            </button>
          ))}
        </div>
      </div>

      {isLoading && <div className="h-96 rounded-xl bg-gray-100 animate-pulse" />}

      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-red-700 font-medium mb-2">No se pudieron cargar las tendencias.</p>
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
          {data.series.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center text-gray-500">
              Sin datos de gastos en el período seleccionado.
            </div>
          ) : (
            <div className="rounded-xl border border-gray-100 bg-white p-5">
              <FinanceTrendsChart data={data} />
            </div>
          )}

          {topCategories.length > 0 && (
            <div className="rounded-xl border border-gray-100 bg-white p-5">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">
                Top 5 categorías del período
              </h4>
              <ul className="space-y-2">
                {topCategories.map((cat) => {
                  const max = topCategories[0].total || 1;
                  const pct = (cat.total / max) * 100;
                  return (
                    <li key={cat.categoryId} className="flex items-center gap-3">
                      <span
                        className="inline-block w-3 h-3 rounded-sm flex-shrink-0"
                        style={{ backgroundColor: cat.color ?? '#9ca3af' }}
                      />
                      <span className="flex-1 text-sm text-gray-700 truncate">
                        {cat.categoryName}
                      </span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, backgroundColor: cat.color ?? '#6366f1' }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-900 w-28 text-right">
                        {currency(cat.total)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
