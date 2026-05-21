/**
 * GoalCard Component
 * F-02 - Metas y Objetivos
 */

import { useNavigate } from 'react-router-dom';
import type { GoalWithProgress } from '@horus/shared';

const PRIORITY_CONFIG = {
  alta: { label: 'Alta', className: 'bg-red-100 text-red-700' },
  media: { label: 'Media', className: 'bg-yellow-100 text-yellow-700' },
  baja: { label: 'Baja', className: 'bg-green-100 text-green-700' },
};

const STATUS_CONFIG = {
  en_progreso: { label: 'En progreso', className: 'bg-blue-100 text-blue-700' },
  completada: { label: 'Completada', className: 'bg-emerald-100 text-emerald-700' },
  cancelada: { label: 'Cancelada', className: 'bg-gray-100 text-gray-500' },
};

function getDaysRemaining(targetDate: string | null | undefined): number | null {
  if (!targetDate) return null;
  const diff = new Date(targetDate).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getProgressColor(progress: number): string {
  if (progress >= 100) return 'bg-emerald-500';
  if (progress >= 80) return 'bg-yellow-400';
  return 'bg-blue-500';
}

interface GoalCardProps {
  goal: GoalWithProgress;
  onEdit: (goal: GoalWithProgress) => void;
  onDelete: (goal: GoalWithProgress) => void;
}

export function GoalCard({ goal, onEdit, onDelete }: GoalCardProps) {
  const navigate = useNavigate();
  const daysRemaining = getDaysRemaining(goal.targetDate);
  const priorityConfig = PRIORITY_CONFIG[goal.priority];
  const statusConfig = STATUS_CONFIG[goal.status];
  const progressColor = getProgressColor(goal.progress);

  return (
    <div
      className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow group cursor-pointer"
      onClick={() => navigate(`/goals/${goal.id}`)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {goal.category?.icon && (
            <span className="text-xl flex-shrink-0">{goal.category.icon}</span>
          )}
          <h3 className="text-sm font-semibold text-gray-900 truncate">{goal.title}</h3>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(goal);
            }}
            className="p-1 rounded text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
            title="Editar"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(goal);
            }}
            className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Eliminar"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5">
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityConfig.className}`}
        >
          {priorityConfig.label}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusConfig.className}`}>
          {statusConfig.label}
        </span>
        {daysRemaining !== null && goal.status === 'en_progreso' && (
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${daysRemaining <= 7 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}
          >
            {daysRemaining <= 0 ? 'Vencida' : `${daysRemaining}d restantes`}
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-500">Progreso</span>
          <span
            className={`text-xs font-bold ${goal.progress >= 100 ? 'text-emerald-600' : 'text-gray-700'}`}
          >
            {goal.progress}%
          </span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${progressColor}`}
            style={{ width: `${Math.min(goal.progress, 100)}%` }}
          />
        </div>
      </div>

      {/* Counters */}
      <div className="flex items-center gap-3 text-xs text-gray-400 pt-0.5">
        {(goal.keyResults?.length ?? 0) > 0 && <span>🎯 {goal.keyResults?.length} KRs</span>}
        {goal.linkedHabitsCount > 0 && <span>🔄 {goal.linkedHabitsCount} hábitos</span>}
        {goal.linkedTasksCount > 0 && <span>✅ {goal.linkedTasksCount} tareas</span>}
      </div>
    </div>
  );
}
