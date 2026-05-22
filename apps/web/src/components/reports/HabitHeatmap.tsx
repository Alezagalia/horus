/**
 * HabitHeatmap — GitHub-style contributions grid
 * F-07 - Reportes y Tendencias
 * Sprint 15 - US-148
 */

import { useId, useMemo, useState } from 'react';
import type { HabitHeatmap as HabitHeatmapData, HabitHeatmapDay } from '@horus/shared';

interface HabitHeatmapProps {
  data: HabitHeatmapData;
  cellSize?: number;
  cellGap?: number;
  showMonthLabels?: boolean;
  showWeekdayLabels?: boolean;
  showLegend?: boolean;
  onDayClick?: (day: HabitHeatmapDay) => void;
}

const LEVEL_COLORS: Record<number, string> = {
  0: 'var(--heatmap-0, #ebedf0)',
  1: 'var(--heatmap-1, #9be9a8)',
  2: 'var(--heatmap-2, #40c463)',
  3: 'var(--heatmap-3, #30a14e)',
  4: 'var(--heatmap-4, #216e39)',
};

const MONTH_LABELS_ES = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
];

const WEEKDAY_LABELS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const WEEKDAY_DISPLAY = [false, true, false, true, false, true, false]; // show Lun, Mié, Vie

interface PositionedDay {
  day: HabitHeatmapDay;
  column: number; // week index 0..52
  row: number; // day-of-week 0..6 (0 = Sun)
}

function formatLongDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

export function HabitHeatmap({
  data,
  cellSize = 12,
  cellGap = 2,
  showMonthLabels = true,
  showWeekdayLabels = true,
  showLegend = true,
  onDayClick,
}: HabitHeatmapProps) {
  const tooltipId = useId();
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const positioned: PositionedDay[] = useMemo(() => {
    const result: PositionedDay[] = [];
    let column = 0;
    for (let i = 0; i < data.days.length; i++) {
      const day = data.days[i];
      const [y, m, d] = day.date.split('-').map(Number);
      const row = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
      if (i > 0 && row === 0) column += 1;
      result.push({ day, column, row });
    }
    return result;
  }, [data.days]);

  const totalColumns = (positioned[positioned.length - 1]?.column ?? 0) + 1;

  // Calculate month label positions (first column for each month)
  const monthLabels = useMemo(() => {
    const labels: { month: number; column: number }[] = [];
    let currentMonth = -1;
    for (const p of positioned) {
      const [, monthStr] = p.day.date.split('-');
      const month = Number(monthStr) - 1;
      if (month !== currentMonth) {
        labels.push({ month, column: p.column });
        currentMonth = month;
      }
    }
    return labels;
  }, [positioned]);

  const stepX = cellSize + cellGap;
  const stepY = cellSize + cellGap;
  const weekdayLabelWidth = showWeekdayLabels ? 28 : 0;
  const monthLabelHeight = showMonthLabels ? 18 : 0;
  const svgWidth = weekdayLabelWidth + totalColumns * stepX;
  const svgHeight = monthLabelHeight + 7 * stepY;

  const activeIndex = hoverIndex ?? focusedIndex;
  const active = activeIndex !== null ? positioned[activeIndex] : null;

  const handleKeyDown = (event: React.KeyboardEvent, index: number) => {
    const current = positioned[index];
    if (!current) return;
    let nextIndex = index;
    if (event.key === 'ArrowRight') nextIndex = Math.min(positioned.length - 1, index + 7);
    else if (event.key === 'ArrowLeft') nextIndex = Math.max(0, index - 7);
    else if (event.key === 'ArrowDown') nextIndex = Math.min(positioned.length - 1, index + 1);
    else if (event.key === 'ArrowUp') nextIndex = Math.max(0, index - 1);
    else if (event.key === 'Enter' || event.key === ' ') {
      onDayClick?.(current.day);
      event.preventDefault();
      return;
    } else return;
    event.preventDefault();
    setFocusedIndex(nextIndex);
  };

  return (
    <div className="inline-block">
      <svg
        width={svgWidth}
        height={svgHeight}
        role="img"
        aria-label={`Heatmap de hábitos del año ${data.year}, ${data.totalCompletions} completitudes`}
      >
        {/* Month labels */}
        {showMonthLabels &&
          monthLabels.map((label, i) => (
            <text
              key={`m-${i}`}
              x={weekdayLabelWidth + label.column * stepX}
              y={12}
              fontSize={10}
              fill="#6b7280"
            >
              {MONTH_LABELS_ES[label.month]}
            </text>
          ))}

        {/* Weekday labels */}
        {showWeekdayLabels &&
          WEEKDAY_LABELS_ES.map((label, row) =>
            WEEKDAY_DISPLAY[row] ? (
              <text
                key={`w-${row}`}
                x={0}
                y={monthLabelHeight + row * stepY + cellSize - 2}
                fontSize={10}
                fill="#6b7280"
              >
                {label}
              </text>
            ) : null
          )}

        {/* Cells */}
        {positioned.map((p, i) => {
          const isActive = activeIndex === i;
          const ariaLabel =
            p.day.completions === 0
              ? `Sin actividad · ${formatLongDate(p.day.date)}`
              : `${p.day.completions} hábitos cumplidos · ${formatLongDate(p.day.date)}`;
          return (
            <rect
              key={p.day.date}
              x={weekdayLabelWidth + p.column * stepX}
              y={monthLabelHeight + p.row * stepY}
              width={cellSize}
              height={cellSize}
              rx={2}
              ry={2}
              fill={LEVEL_COLORS[p.day.level]}
              stroke={isActive ? '#4f46e5' : 'none'}
              strokeWidth={isActive ? 1.5 : 0}
              tabIndex={0}
              aria-label={ariaLabel}
              aria-describedby={tooltipId}
              role="button"
              style={{ cursor: onDayClick ? 'pointer' : 'default', outline: 'none' }}
              onMouseEnter={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex(null)}
              onFocus={() => setFocusedIndex(i)}
              onBlur={() => setFocusedIndex(null)}
              onClick={() => onDayClick?.(p.day)}
              onKeyDown={(e) => handleKeyDown(e, i)}
            />
          );
        })}
      </svg>

      {/* Tooltip */}
      <div id={tooltipId} aria-live="polite" className="mt-2 h-5 text-xs text-gray-600">
        {active
          ? active.day.completions === 0
            ? `Sin actividad · ${formatLongDate(active.day.date)}`
            : `${active.day.completions} hábitos cumplidos · ${formatLongDate(active.day.date)}`
          : ' '}
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
          <span>Menos</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <span
              key={level}
              className="inline-block"
              style={{
                width: cellSize,
                height: cellSize,
                backgroundColor: LEVEL_COLORS[level],
                borderRadius: 2,
              }}
            />
          ))}
          <span>Más</span>
        </div>
      )}
    </div>
  );
}
