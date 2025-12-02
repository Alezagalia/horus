/**
 * Habit Progress Card Component
 * Sprint 11 - US-097
 */

import { useNavigate } from 'react-router-dom';
import { Card } from './Card';
import type { HabitSummary } from '@/types/dashboard';

interface HabitProgressCardProps {
  habits: HabitSummary[];
  completionPercentage: number;
}

export function HabitProgressCard({ habits, completionPercentage }: HabitProgressCardProps) {
  const navigate = useNavigate();

  const completedCount = habits.filter((h) => h.completed).length;
  const totalCount = habits.length;

  return (
    <Card
      title="Hábitos de Hoy"
      action={{
        label: 'Ver todos',
        onClick: () => navigate('/habits/today'),
      }}
    >
      {habits.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">📋</div>
          <p className="text-gray-500 text-sm">No tienes hábitos configurados</p>
          <button
            onClick={() => navigate('/habits')}
            className="mt-4 text-sm text-indigo-600 hover:text-indigo-500"
          >
            Crear tu primer hábito
          </button>
        </div>
      ) : (
        <>
          {/* Circular Progress */}
          <div className="flex items-center justify-center mb-6">
            <div className="relative w-32 h-32">
              <svg className="transform -rotate-90 w-32 h-32">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-gray-200"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 56}`}
                  strokeDashoffset={`${2 * Math.PI * 56 * (1 - completionPercentage / 100)}`}
                  className="text-indigo-600 transition-all duration-300"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-gray-900">
                  {Math.round(completionPercentage)}%
                </span>
                <span className="text-xs text-gray-500">
                  {completedCount}/{totalCount}
                </span>
              </div>
            </div>
          </div>

          {/* Habit List */}
          <div className="space-y-3">
            {habits.slice(0, 5).map((habit) => (
              <div
                key={habit.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={habit.completed}
                  readOnly
                  className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {habit.categoryIcon && <span className="text-lg">{habit.categoryIcon}</span>}
                    <span
                      className={`text-sm font-medium ${
                        habit.completed ? 'line-through text-gray-400' : 'text-gray-900'
                      }`}
                    >
                      {habit.name}
                    </span>
                  </div>
                </div>
                {habit.currentStreak > 0 && (
                  <div className="flex items-center gap-1 text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded">
                    🔥 {habit.currentStreak}
                  </div>
                )}
              </div>
            ))}
            {habits.length > 5 && (
              <button
                onClick={() => navigate('/habits/today')}
                className="w-full text-center text-sm text-gray-500 hover:text-gray-700 py-2"
              >
                Ver {habits.length - 5} más...
              </button>
            )}
          </div>
        </>
      )}
    </Card>
  );
}
