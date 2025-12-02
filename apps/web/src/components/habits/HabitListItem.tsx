/**
 * Habit List Item Component
 * Sprint 11 - US-099, US-100
 */

import { useNavigate } from 'react-router-dom';
import type { Habit } from '@/types/habits';

interface HabitListItemProps {
  habit: Habit;
  onEdit: (habitId: string) => void;
  onToggleActive: (habitId: string) => void;
}

const typeLabels = {
  CHECK: 'Marcar',
  NUMERIC: 'Numérico',
};

const periodicityLabels = {
  DAILY: 'Diario',
  WEEKLY: 'Semanal',
  MONTHLY: 'Mensual',
  CUSTOM: 'Personalizado',
};

const timeOfDayLabels: Record<string, string> = {
  AYUNO: '🍽️ En ayuno',
  MANANA: '🌅 Mañana',
  MEDIA_MANANA: '☕ Media mañana',
  TARDE: '☀️ Tarde',
  MEDIA_TARDE: '🍵 Media tarde',
  NOCHE: '🌙 Noche',
  ANTES_DORMIR: '🛏️ Antes de dormir',
  ANYTIME: '⏰ Cualquier momento',
};

const weekDayNames = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

export function HabitListItem({ habit, onEdit, onToggleActive }: HabitListItemProps) {
  const navigate = useNavigate();

  const getPeriodicityDisplay = () => {
    if (habit.periodicity === 'WEEKLY' && habit.weekDays && habit.weekDays.length > 0) {
      const days = habit.weekDays.map((d) => weekDayNames[d]).join(',');
      return `Semanal (${days})`;
    }
    return periodicityLabels[habit.periodicity];
  };

  return (
    <div
      className={`bg-white rounded-lg border-2 border-gray-200 p-4 transition-all duration-200 hover:shadow-md ${
        !habit.isActive ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Category Icon */}
        <div
          className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
          style={{ backgroundColor: habit.categoryColor ? `${habit.categoryColor}20` : '#F3F4F6' }}
        >
          {habit.categoryIcon || '📋'}
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 truncate">{habit.name}</h3>
              {habit.description && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{habit.description}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => navigate(`/habits/${habit.id}/stats`)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                title="Ver estadísticas"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </button>
              <button
                onClick={() => onEdit(habit.id)}
                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                title="Editar hábito"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
              <button
                onClick={() => onToggleActive(habit.id)}
                className={`p-2 rounded-md transition-colors ${
                  habit.isActive
                    ? 'text-gray-600 hover:bg-gray-100'
                    : 'text-green-600 hover:bg-green-50'
                }`}
                title={habit.isActive ? 'Desactivar hábito' : 'Activar hábito'}
              >
                {habit.isActive ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                    />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Metadata */}
          <div className="flex flex-wrap gap-2">
            {/* Type Badge */}
            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-700">
              {typeLabels[habit.type]}
              {habit.type === 'NUMERIC' && habit.targetValue && (
                <span className="ml-1">
                  ({habit.targetValue} {habit.unit || 'u'})
                </span>
              )}
            </span>

            {/* Periodicity Badge */}
            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-700">
              {getPeriodicityDisplay()}
            </span>

            {/* Time of Day Badge */}
            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-amber-100 text-amber-700">
              {timeOfDayLabels[habit.timeOfDay] || habit.timeOfDay}
            </span>

            {/* Category Badge */}
            <span
              className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium"
              style={{
                backgroundColor: habit.categoryColor ? `${habit.categoryColor}30` : '#F3F4F6',
                color: habit.categoryColor || '#374151',
              }}
            >
              {habit.categoryName}
            </span>

            {/* Streak Badge */}
            {habit.currentStreak > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-orange-100 text-orange-700">
                🔥 {habit.currentStreak} días
              </span>
            )}

            {/* Best Streak */}
            {habit.longestStreak > 0 && habit.longestStreak > habit.currentStreak && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
                ⭐ Mejor: {habit.longestStreak}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
