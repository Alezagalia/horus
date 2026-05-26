/**
 * MacrosBar - barra de progreso de macros del día
 * F-17 Sprint 2
 */

import type { MacroTotals } from '@horus/shared';

interface MacrosBarProps {
  current: MacroTotals;
  target?: MacroTotals;
}

function Bar({
  label,
  value,
  target,
  color,
}: {
  label: string;
  value: number;
  target?: number;
  color: string;
}) {
  const pct = target ? Math.min(100, (value / target) * 100) : 0;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs text-gray-600">
        <span>{label}</span>
        <span>
          {value.toFixed(0)}g{target ? ` / ${target}g` : ''}
        </span>
      </div>
      {target && (
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${color} rounded-full transition-all`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}

export function MacrosBar({ current, target }: MacrosBarProps) {
  return (
    <div className="space-y-2 p-3 bg-gray-50 rounded-xl">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-semibold text-gray-700">Macros del día</span>
        <span className="text-sm font-bold text-orange-600">
          {Math.round(current.calories)} kcal
        </span>
      </div>
      <Bar label="Proteína" value={current.protein} target={target?.protein} color="bg-blue-500" />
      <Bar
        label="Carbohidratos"
        value={current.carbs}
        target={target?.carbs}
        color="bg-yellow-500"
      />
      <Bar label="Grasa" value={current.fat} target={target?.fat} color="bg-red-500" />
      {current.fiber > 0 && (
        <Bar label="Fibra" value={current.fiber} target={target?.fiber} color="bg-green-500" />
      )}
    </div>
  );
}
