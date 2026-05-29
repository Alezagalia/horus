/**
 * Routine Step Row Component
 * Compact habit row for Routine View mode in HabitsTodayPage
 */

import toast from 'react-hot-toast';
import type { HabitOfDay } from '@/types/habits';

interface RoutineStepRowProps {
  habit: HabitOfDay;
  stepNumber: number;
  isActive: boolean;
  onToggleComplete?: (habitId: string) => void;
  disabled?: boolean;
}

export function RoutineStepRow({
  habit,
  stepNumber,
  isActive,
  onToggleComplete,
  disabled = false,
}: RoutineStepRowProps) {
  const handleToggle = () => {
    if (disabled || !onToggleComplete) return;
    onToggleComplete(habit.id);
    if (!habit.completed) {
      toast.success(`¡${habit.name} completado!`, { icon: '✅', duration: 2000 });
    }
  };

  return (
    <div
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 ${
        habit.completed
          ? 'opacity-60'
          : isActive
            ? 'border-l-4 border-indigo-500 bg-indigo-50/60 pl-2'
            : 'border-l-4 border-transparent'
      }`}
    >
      {/* Step number */}
      <span className="flex-shrink-0 w-5 text-xs text-gray-400 text-right select-none">
        {stepNumber}
      </span>

      {/* Check button */}
      <button
        onClick={handleToggle}
        disabled={disabled}
        className={`flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
          habit.completed
            ? 'bg-green-500 border-green-500 shadow-sm shadow-green-500/30'
            : isActive
              ? 'border-indigo-400 hover:border-indigo-500 hover:shadow-md'
              : 'border-gray-300 hover:border-green-400'
        } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
      >
        {habit.completed && (
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Habit info */}
      <div className="flex-1 min-w-0 flex items-center gap-2">
        {habit.categoryIcon && (
          <span className="text-base flex-shrink-0">{habit.categoryIcon}</span>
        )}
        <span
          className={`text-sm truncate ${
            habit.completed
              ? 'line-through text-gray-400'
              : isActive
                ? 'font-semibold text-gray-900'
                : 'text-gray-700'
          }`}
        >
          {habit.name}
        </span>
        {habit.type === 'NUMERIC' && habit.targetValue && !habit.completed && (
          <span className="text-xs text-gray-400 flex-shrink-0">
            {habit.targetValue} {habit.unit || 'u'}
          </span>
        )}
      </div>

      {/* Streak badge */}
      {habit.currentStreak > 0 && (
        <span className="flex-shrink-0 text-xs font-medium text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full">
          🔥 {habit.currentStreak}
        </span>
      )}
    </div>
  );
}
