/**
 * Life Debt - Item Card
 * F-14 - Deuda de Vida
 * Sprint 17
 */

import type { LifeDebtItem, LifeDebtItemType } from '@horus/shared';

interface LifeDebtItemCardProps {
  item: LifeDebtItem;
  onDecide?: (item: LifeDebtItem) => void;
  onReview?: (item: LifeDebtItem) => void;
}

const TYPE_LABEL: Record<LifeDebtItemType, string> = {
  task: 'Tarea',
  habit: 'Hábito',
  recurring_expense: 'Gasto recurrente',
};

const TYPE_GRADIENT: Record<LifeDebtItemType, string> = {
  task: 'from-amber-500 to-orange-500',
  habit: 'from-blue-500 to-cyan-500',
  recurring_expense: 'from-emerald-500 to-teal-500',
};

const TYPE_ICON: Record<LifeDebtItemType, string> = {
  task: '✅',
  habit: '🎯',
  recurring_expense: '💸',
};

function agingLabel(days: number): string {
  if (days < 30) return `${days} días`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} ${months === 1 ? 'mes' : 'meses'}`;
  const years = Math.floor(days / 365);
  return `${years} ${years === 1 ? 'año' : 'años'}`;
}

export function LifeDebtItemCard({ item, onDecide, onReview }: LifeDebtItemCardProps) {
  const isRecurring = item.type === 'recurring_expense';

  return (
    <div className="flex items-start gap-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <div
        className={`w-10 h-10 rounded-lg bg-gradient-to-br ${TYPE_GRADIENT[item.type]} flex items-center justify-center text-xl flex-shrink-0`}
      >
        {TYPE_ICON[item.type]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            {TYPE_LABEL[item.type]}
          </span>
          <span className="text-xs text-gray-400">·</span>
          <span className="text-xs text-gray-500">Antigüedad: {agingLabel(item.agingDays)}</span>
        </div>
        <h3 className="font-semibold text-gray-900 truncate">{item.title}</h3>
        <p className="text-sm text-gray-600 mt-1">{item.reason}</p>
      </div>
      <div className="flex-shrink-0">
        {isRecurring ? (
          <button
            type="button"
            onClick={() => onReview?.(item)}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700"
          >
            Marcar revisado
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onDecide?.(item)}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
          >
            Decidir
          </button>
        )}
      </div>
    </div>
  );
}
