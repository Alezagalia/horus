/**
 * Task Card Component
 * Sprint 11 - US-101
 */

import { useState } from 'react';
import type { Task } from '@/types/tasks';
import { ChecklistItem } from './ChecklistItem';

interface TaskCardProps {
  task: Task;
  onToggleComplete: (taskId: string) => void;
  onEdit: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onViewDetails: (taskId: string) => void;
  onToggleChecklistItem?: (taskId: string, itemId: string, currentCompleted: boolean) => void;
}

const priorityColors = {
  alta: 'bg-red-100 text-red-700 border-red-300',
  media: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  baja: 'bg-green-100 text-green-700 border-green-300',
};

const priorityLabels = {
  alta: 'Alta',
  media: 'Media',
  baja: 'Baja',
};

// Helper para extraer fecha del ISO string sin conversión de timezone
function getDateFromISO(isoString: string): { year: number; month: number; day: number } {
  const [datePart] = isoString.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  return { year, month, day };
}

// Helper para comparar fechas sin timezone issues
function isSameDay(isoString: string, compareDate: Date): boolean {
  const { year, month, day } = getDateFromISO(isoString);
  return (
    compareDate.getFullYear() === year &&
    compareDate.getMonth() + 1 === month &&
    compareDate.getDate() === day
  );
}

// Helper para verificar si la fecha ISO es anterior a hoy
function isBeforeToday(isoString: string): boolean {
  const { year, month, day } = getDateFromISO(isoString);
  const today = new Date();
  const dueDate = new Date(year, month - 1, day);
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return dueDate < todayStart;
}

export function TaskCard({
  task,
  onToggleComplete,
  onEdit,
  onDelete,
  onViewDetails,
  onToggleChecklistItem,
}: TaskCardProps) {
  const [isChecklistExpanded, setIsChecklistExpanded] = useState(false);

  const isOverdue = task.dueDate && isBeforeToday(task.dueDate) && !task.completedAt;
  const isDueToday = task.dueDate && isSameDay(task.dueDate, new Date()) && !task.completedAt;
  const isDueTomorrow =
    task.dueDate &&
    !task.completedAt &&
    !isDueToday &&
    (() => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return isSameDay(task.dueDate!, tomorrow);
    })();

  const getDueDateLabel = () => {
    if (!task.dueDate) return null;
    if (task.completedAt) return null;
    if (isOverdue) return { text: 'Vencida', color: 'text-red-600' };
    if (isDueToday) return { text: 'Vence hoy', color: 'text-orange-600' };
    if (isDueTomorrow) return { text: 'Vence mañana', color: 'text-yellow-600' };

    const { year, month, day } = getDateFromISO(task.dueDate);
    const dueDate = new Date(year, month - 1, day);
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const days = Math.ceil((dueDate.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24));
    return { text: `En ${days} días`, color: 'text-gray-600' };
  };

  const checklistProgress =
    task.checklist.length > 0
      ? {
          completed: task.checklist.filter((item) => item.completed).length,
          total: task.checklist.length,
        }
      : null;

  const dueDateLabel = getDueDateLabel();

  const handleChecklistToggle = (itemId: string, currentCompleted: boolean) => {
    onToggleChecklistItem?.(task.id, itemId, currentCompleted);
  };

  return (
    <div
      className={`bg-white rounded-lg border-2 p-4 transition-all hover:shadow-md ${
        isOverdue
          ? 'border-red-300'
          : task.completedAt
            ? 'border-gray-200 bg-gray-50'
            : 'border-gray-200'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={() => onToggleComplete(task.id)}
          className={`flex-shrink-0 w-6 h-6 rounded border-2 transition-all mt-1 ${
            task.completedAt
              ? 'bg-green-500 border-green-500'
              : 'border-gray-300 hover:border-green-500'
          } flex items-center justify-center`}
        >
          {task.completedAt && (
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3
              className={`font-semibold text-gray-900 ${task.completedAt ? 'line-through text-gray-500' : ''}`}
            >
              {task.title}
            </h3>

            {/* Priority Badge */}
            <span
              className={`flex-shrink-0 px-2 py-1 text-xs font-medium rounded-md border ${priorityColors[task.priority]}`}
            >
              {priorityLabels[task.priority]}
            </span>
          </div>

          {task.description && (
            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{task.description}</p>
          )}

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            {/* Category */}
            <span className="flex items-center gap-1 text-gray-600">
              {task.categoryIcon && <span>{task.categoryIcon}</span>}
              {task.categoryName}
            </span>

            {/* Due Date */}
            {dueDateLabel && (
              <span className={`font-medium ${dueDateLabel.color}`}>{dueDateLabel.text}</span>
            )}

            {/* Checklist Progress - Clickeable */}
            {checklistProgress && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsChecklistExpanded(!isChecklistExpanded);
                }}
                className="flex items-center gap-1 text-gray-600 hover:text-indigo-600 transition-colors"
              >
                <svg
                  className={`w-4 h-4 transition-transform ${isChecklistExpanded ? 'rotate-90' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
                <span>
                  {checklistProgress.completed}/{checklistProgress.total} items
                </span>
              </button>
            )}
          </div>

          {/* Checklist Expandido - Usando componente separado */}
          {isChecklistExpanded && task.checklist.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
              {task.checklist.map((item) => (
                <ChecklistItem
                  key={item.id}
                  id={item.id}
                  text={item.text}
                  initialCompleted={item.completed}
                  onToggle={handleChecklistToggle}
                />
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onViewDetails(task.id)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            title="Ver detalles"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          </button>
          <button
            onClick={() => onEdit(task.id)}
            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
            title="Editar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
            title="Eliminar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    </div>
  );
}
