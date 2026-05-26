/**
 * MacrosBadge - chip con resumen de macros
 * F-17 Sprint 1
 */

import type { MacroTotals } from '@horus/shared';

interface MacrosBadgeProps {
  macros: MacroTotals;
  size?: 'sm' | 'md';
}

export function MacrosBadge({ macros, size = 'md' }: MacrosBadgeProps) {
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';
  const padding = size === 'sm' ? 'px-2 py-0.5' : 'px-3 py-1';

  return (
    <div className={`flex items-center gap-2 flex-wrap ${textSize}`}>
      <span className={`${padding} rounded-full bg-orange-100 text-orange-700 font-semibold`}>
        {Math.round(macros.calories)} kcal
      </span>
      <span className={`${padding} rounded-full bg-blue-100 text-blue-700 font-medium`}>
        P {macros.protein.toFixed(1)}g
      </span>
      <span className={`${padding} rounded-full bg-yellow-100 text-yellow-700 font-medium`}>
        C {macros.carbs.toFixed(1)}g
      </span>
      <span className={`${padding} rounded-full bg-red-100 text-red-700 font-medium`}>
        G {macros.fat.toFixed(1)}g
      </span>
      {macros.fiber > 0 && (
        <span className={`${padding} rounded-full bg-green-100 text-green-700 font-medium`}>
          F {macros.fiber.toFixed(1)}g
        </span>
      )}
    </div>
  );
}
