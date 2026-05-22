/**
 * ProductivityHeatmap — 7×24 day-of-week × hour cells
 * F-07 - Reportes y Tendencias
 * Sprint 15 - US-149
 */

import { useMemo } from 'react';
import type { Productivity } from '@horus/shared';

interface ProductivityHeatmapProps {
  data: Productivity;
  cellSize?: number;
}

const WEEKDAY_LABELS_ES = ['D', 'L', 'M', 'X', 'J', 'V', 'S']; // Sun..Sat
const HOUR_LABELS = [0, 3, 6, 9, 12, 15, 18, 21];

function color(completed: number, max: number): string {
  if (max === 0 || completed === 0) return 'var(--prod-0, #f3f4f6)';
  const ratio = completed / max;
  if (ratio <= 0.2) return 'var(--prod-1, #c7d2fe)';
  if (ratio <= 0.4) return 'var(--prod-2, #818cf8)';
  if (ratio <= 0.6) return 'var(--prod-3, #6366f1)';
  if (ratio <= 0.8) return 'var(--prod-4, #4f46e5)';
  return 'var(--prod-5, #3730a3)';
}

const DAY_NAMES_FULL = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export function ProductivityHeatmap({ data, cellSize = 22 }: ProductivityHeatmapProps) {
  const max = useMemo(
    () => data.heatmap.reduce((acc, c) => (c.completed > acc ? c.completed : acc), 0),
    [data.heatmap]
  );

  const grid = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of data.heatmap) {
      m.set(`${c.dayOfWeek}-${c.hour}`, c.completed);
    }
    return m;
  }, [data.heatmap]);

  const gap = 2;
  const labelHeight = 18;
  const labelWidth = 22;
  const width = labelWidth + 24 * (cellSize + gap);
  const height = labelHeight + 7 * (cellSize + gap);

  return (
    <div className="overflow-x-auto">
      <svg
        width={width}
        height={height}
        role="img"
        aria-label="Heatmap de productividad por día y hora"
      >
        {/* Hour labels */}
        {HOUR_LABELS.map((h) => (
          <text
            key={`h-${h}`}
            x={labelWidth + h * (cellSize + gap)}
            y={12}
            fontSize={10}
            fill="#6b7280"
          >
            {h}h
          </text>
        ))}

        {/* Day labels */}
        {WEEKDAY_LABELS_ES.map((label, row) => (
          <text
            key={`d-${row}`}
            x={0}
            y={labelHeight + row * (cellSize + gap) + cellSize / 2 + 4}
            fontSize={10}
            fill="#6b7280"
          >
            {label}
          </text>
        ))}

        {/* Cells */}
        {Array.from({ length: 7 }).flatMap((_, row) =>
          Array.from({ length: 24 }).map((__, hour) => {
            const count = grid.get(`${row}-${hour}`) ?? 0;
            const isBest =
              data.bestDayOfWeek?.dayOfWeek === row && data.bestHour?.hour === hour && count > 0;
            return (
              <rect
                key={`${row}-${hour}`}
                x={labelWidth + hour * (cellSize + gap)}
                y={labelHeight + row * (cellSize + gap)}
                width={cellSize}
                height={cellSize}
                rx={3}
                ry={3}
                fill={color(count, max)}
                stroke={isBest ? '#4f46e5' : 'none'}
                strokeWidth={isBest ? 2 : 0}
              >
                <title>
                  {`${DAY_NAMES_FULL[row]} ${String(hour).padStart(2, '0')}:00 — ${count} tareas`}
                </title>
              </rect>
            );
          })
        )}
      </svg>
    </div>
  );
}
