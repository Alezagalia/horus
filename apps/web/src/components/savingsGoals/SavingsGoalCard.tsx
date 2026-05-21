/**
 * SavingsGoalCard
 * Displays a savings goal with progress bar, amounts, and actions.
 */

import { Pencil, Trash2 } from 'lucide-react';
import type { SavingsGoalWithProgress } from '@horus/shared';

interface Props {
  goal: SavingsGoalWithProgress;
  onEdit: (goal: SavingsGoalWithProgress) => void;
  onDelete: (id: string) => void;
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(amount);
}

function getDaysRemaining(targetDate: string | null | undefined): number | null {
  if (!targetDate) return null;
  const diff = new Date(targetDate).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getProgressColor(progress: number) {
  if (progress >= 100) return 'bg-green-500';
  if (progress >= 80) return 'bg-yellow-400';
  return 'bg-blue-500';
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  en_progreso: { label: 'En progreso', className: 'bg-blue-100 text-blue-700' },
  completada: { label: 'Completada', className: 'bg-green-100 text-green-700' },
  cancelada: { label: 'Cancelada', className: 'bg-gray-100 text-gray-600' },
};

export function SavingsGoalCard({ goal, onEdit, onDelete }: Props) {
  const { label, className: statusClassName } =
    STATUS_LABELS[goal.status] ?? STATUS_LABELS.en_progreso;
  const daysRemaining = getDaysRemaining(goal.targetDate);
  const progressColor = getProgressColor(goal.progress);
  const currency = goal.account.currency;

  return (
    <div className="group relative bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xl">{goal.account.icon}</span>
          <div className="min-w-0">
            <p className="text-xs text-gray-500 truncate">{goal.account.name}</p>
            <h3 className="font-semibold text-gray-900 truncate">{goal.name}</h3>
          </div>
        </div>
        <span
          className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${statusClassName}`}
        >
          {label}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-2">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>{goal.progress}%</span>
          {daysRemaining !== null && (
            <span>
              {daysRemaining > 0
                ? `${daysRemaining} días restantes`
                : daysRemaining === 0
                  ? 'Vence hoy'
                  : `Vencida hace ${Math.abs(daysRemaining)} días`}
            </span>
          )}
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${progressColor}`}
            style={{ width: `${goal.progress}%` }}
          />
        </div>
      </div>

      {/* Amounts */}
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-semibold text-gray-900">
          {formatCurrency(goal.savedAmount, currency)}
        </span>
        <span className="text-gray-400">de {formatCurrency(goal.targetAmount, currency)}</span>
      </div>

      {goal.remaining > 0 && goal.status === 'en_progreso' && (
        <p className="text-xs text-gray-400 mt-1">
          Faltan {formatCurrency(goal.remaining, currency)}
        </p>
      )}

      {/* Actions (visible on hover) */}
      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(goal)}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
          title="Editar"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={() => onDelete(goal.id)}
          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
          title="Eliminar"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Notes */}
      {goal.notes && (
        <p className="mt-3 text-xs text-gray-500 border-t border-gray-100 pt-2 line-clamp-2">
          {goal.notes}
        </p>
      )}
    </div>
  );
}
