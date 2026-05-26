/**
 * DayMacrosSummary - resumen de macros por día
 * F-17 Sprint 2
 */

import type { DayMacros } from '@horus/shared';

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

interface DayMacrosSummaryProps {
  dayMacros: DayMacros[];
}

export function DayMacrosSummary({ dayMacros }: DayMacrosSummaryProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {dayMacros.map(({ day, macros }) => {
        const date = new Date(day + 'T12:00:00');
        const dayName = DAY_NAMES[date.getDay()];
        const dayNum = date.getDate();

        return (
          <div key={day} className="flex-shrink-0 w-20 glass-card p-2 rounded-xl text-center">
            <p className="text-xs font-semibold text-gray-500">
              {dayName} {dayNum}
            </p>
            <p className="text-sm font-bold text-orange-600 mt-1">{Math.round(macros.calories)}</p>
            <p className="text-xs text-gray-400">kcal</p>
            <div className="mt-1 space-y-0.5">
              <div
                className="h-1 bg-blue-400 rounded-full"
                style={{ width: `${Math.min(100, macros.protein / 2)}%`, minWidth: '2px' }}
                title={`P: ${macros.protein.toFixed(0)}g`}
              />
              <div
                className="h-1 bg-yellow-400 rounded-full"
                style={{ width: `${Math.min(100, macros.carbs / 3)}%`, minWidth: '2px' }}
                title={`C: ${macros.carbs.toFixed(0)}g`}
              />
              <div
                className="h-1 bg-red-400 rounded-full"
                style={{ width: `${Math.min(100, macros.fat / 1.5)}%`, minWidth: '2px' }}
                title={`G: ${macros.fat.toFixed(0)}g`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
