/**
 * Completion Rate Card Component
 * Sprint 11 - US-100
 */

import type { CompletionRate } from '@/types/habitStats';

interface CompletionRateCardProps {
  completionRate: CompletionRate;
}

export function CompletionRateCard({ completionRate }: CompletionRateCardProps) {
  const getColorClass = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    if (percentage >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getTextColorClass = (percentage: number) => {
    if (percentage >= 80) return 'text-green-700';
    if (percentage >= 60) return 'text-yellow-700';
    if (percentage >= 40) return 'text-orange-700';
    return 'text-red-700';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Tasa de Cumplimiento</h2>

      <div className="space-y-5">
        {/* Overall */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">General (desde creación)</span>
            <span className={`text-lg font-bold ${getTextColorClass(completionRate.overall)}`}>
              {completionRate.overall}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`${getColorClass(completionRate.overall)} h-3 rounded-full transition-all duration-500`}
              style={{ width: `${completionRate.overall}%` }}
            />
          </div>
        </div>

        {/* Last 30 Days */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Últimos 30 días</span>
            <span className={`text-lg font-bold ${getTextColorClass(completionRate.last30Days)}`}>
              {completionRate.last30Days}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`${getColorClass(completionRate.last30Days)} h-3 rounded-full transition-all duration-500`}
              style={{ width: `${completionRate.last30Days}%` }}
            />
          </div>
        </div>

        {/* Last 7 Days */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Últimos 7 días</span>
            <span className={`text-lg font-bold ${getTextColorClass(completionRate.last7Days)}`}>
              {completionRate.last7Days}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`${getColorClass(completionRate.last7Days)} h-3 rounded-full transition-all duration-500`}
              style={{ width: `${completionRate.last7Days}%` }}
            />
          </div>
        </div>
      </div>

      {/* Insight Message */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          {completionRate.last7Days > completionRate.last30Days ? (
            <span>
              📈 <strong>¡Vas mejorando!</strong> Tu tasa esta semana es mayor que el promedio
              mensual.
            </span>
          ) : completionRate.last7Days < completionRate.last30Days ? (
            <span>
              📉 <strong>Intenta recuperar tu ritmo.</strong> Esta semana ha sido más difícil que tu
              promedio.
            </span>
          ) : (
            <span>
              ➡️ <strong>Mantén la consistencia.</strong> Tu tasa se mantiene estable.
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
