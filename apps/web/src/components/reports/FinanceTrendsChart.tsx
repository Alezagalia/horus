/**
 * FinanceTrendsChart — stacked area chart for monthly spend per category
 * F-07 - Reportes y Tendencias
 * Sprint 15 - US-149
 */

import { useMemo } from 'react';
import {
  Area,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceDot,
} from 'recharts';
import type { FinanceTrends } from '@horus/shared';

interface FinanceTrendsChartProps {
  data: FinanceTrends;
  height?: number;
  showProjection?: boolean;
}

const FALLBACK_PALETTE = [
  '#6366F1', // indigo
  '#10B981', // emerald
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#14B8A6', // teal
  '#84CC16', // lime
  '#F97316', // orange
  '#0EA5E9', // sky
];

const formatMonthLabel = (key: string): string => {
  const [y, m] = key.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, 1));
  const month = new Intl.DateTimeFormat('es-AR', { month: 'short', timeZone: 'UTC' }).format(dt);
  return month.charAt(0).toUpperCase() + month.slice(1, 3);
};

const formatCompact = (n: number): string => {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return n.toString();
};

const formatCurrency = (n: number): string =>
  n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

export function FinanceTrendsChart({
  data,
  height = 360,
  showProjection = true,
}: FinanceTrendsChartProps) {
  const seriesWithColor = useMemo(
    () =>
      data.series.map((s, i) => ({
        ...s,
        resolvedColor: s.color ?? FALLBACK_PALETTE[i % FALLBACK_PALETTE.length],
      })),
    [data.series]
  );

  const chartData = useMemo(() => {
    return data.months.map((month) => {
      const row: Record<string, string | number> = { month };
      for (const s of seriesWithColor) {
        const point = s.points.find((p) => p.month === month);
        row[s.categoryId] = point?.amount ?? 0;
      }
      return row;
    });
  }, [data.months, seriesWithColor]);

  const projection = showProjection ? data.projection : null;

  return (
    <div className="space-y-3">
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData} margin={{ top: 10, right: 20, bottom: 0, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="month" tickFormatter={formatMonthLabel} fontSize={12} stroke="#6b7280" />
          <YAxis tickFormatter={formatCompact} fontSize={12} stroke="#6b7280" />
          <Tooltip
            formatter={(value: number) => formatCurrency(value)}
            labelFormatter={(label: string) => formatMonthLabel(label)}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {seriesWithColor.map((s) => (
            <Area
              key={s.categoryId}
              type="monotone"
              dataKey={s.categoryId}
              name={s.categoryName}
              stackId="1"
              stroke={s.resolvedColor}
              fill={s.resolvedColor}
              fillOpacity={0.55}
            />
          ))}
          {projection && (
            <ReferenceDot
              x={projection.month}
              y={projection.projectedTotal}
              r={5}
              fill="#4f46e5"
              stroke="white"
              strokeWidth={2}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>

      {projection && (
        <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700">
          <span className="w-2 h-2 rounded-full bg-indigo-600" />
          Proyectado fin de mes: {formatCurrency(projection.projectedTotal)}
          <span className="text-indigo-500">
            ({projection.daysElapsed}/{projection.daysInMonth} días)
          </span>
        </div>
      )}
    </div>
  );
}
