/**
 * Habit Card Component
 * Sprint 11 - US-098
 */

import { useState } from 'react';
import toast from 'react-hot-toast';
import type { HabitOfDay } from '@/types/habits';

interface HabitCardProps {
  habit: HabitOfDay;
  onToggleComplete?: (habitId: string) => void;
  onUpdateValue?: (habitId: string, value: number) => void;
  onUpdateNotes?: (habitId: string, notes: string) => void;
  disabled?: boolean;
}

export function HabitCard({
  habit,
  onToggleComplete,
  onUpdateValue,
  onUpdateNotes,
  disabled = false,
}: HabitCardProps) {
  const [showNotes, setShowNotes] = useState(false);
  const [notesValue, setNotesValue] = useState(habit.notes || '');
  const [numericValue, setNumericValue] = useState(habit.value || 0);

  const handleToggleComplete = () => {
    console.log('handleToggleComplete called', { disabled, hasOnToggleComplete: !!onToggleComplete, habitId: habit.id });
    if (disabled || !onToggleComplete) {
      console.log('Toggle blocked:', { disabled, onToggleComplete: !!onToggleComplete });
      return;
    }
    console.log('Calling onToggleComplete for habit:', habit.id);
    onToggleComplete(habit.id);
    if (!habit.completed) {
      toast.success(`¡${habit.name} completado!`, {
        icon: '✅',
        duration: 2000,
      });
    }
  };

  const handleNumericChange = (newValue: number) => {
    if (disabled || !onUpdateValue) return;
    const validValue = Math.max(0, newValue);
    setNumericValue(validValue);
    onUpdateValue(habit.id, validValue);

    // Check if completed target
    if (habit.targetValue && validValue >= habit.targetValue && !habit.completed && onToggleComplete) {
      onToggleComplete(habit.id);
      toast.success(`¡${habit.name} completado!`, {
        icon: '🎯',
        duration: 2000,
      });
    }
  };

  const handleNotesBlur = () => {
    if (notesValue !== habit.notes && onUpdateNotes) {
      onUpdateNotes(habit.id, notesValue);
      toast.success('Notas guardadas', { icon: '📝', duration: 1500 });
    }
  };

  return (
    <div
      className={`bg-white rounded-lg border-2 transition-all duration-500 ease-in-out ${
        habit.completed
          ? 'border-green-300 bg-green-50 shadow-sm opacity-80'
          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
      }`}
      style={{
        transform: habit.completed ? 'scale(0.98)' : 'scale(1)',
        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Checkbox or Numeric Input */}
          {habit.type === 'CHECK' ? (
            <button
              onClick={handleToggleComplete}
              disabled={disabled}
              className={`flex-shrink-0 w-8 h-8 rounded-full border-2 transition-all duration-300 ${
                habit.completed
                  ? 'bg-green-500 border-green-500 shadow-lg shadow-green-500/30'
                  : 'border-gray-300 hover:border-green-400 hover:shadow-md'
              } flex items-center justify-center ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
              style={{
                transform: habit.completed ? 'scale(1.1)' : 'scale(1)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              {habit.completed && (
                <svg
                  className="w-5 h-5 text-white animate-bounce"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={{ animationDuration: '0.5s', animationIterationCount: 1 }}
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
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleNumericChange(numericValue - 1)}
                disabled={numericValue <= 0}
                className="w-8 h-8 rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-lg font-bold"
              >
                −
              </button>
              <input
                type="number"
                value={numericValue}
                onChange={(e) => handleNumericChange(parseInt(e.target.value) || 0)}
                className="w-16 h-8 text-center border-2 border-gray-300 rounded-md font-semibold focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={() => handleNumericChange(numericValue + 1)}
                className="w-8 h-8 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-lg font-bold"
              >
                +
              </button>
            </div>
          )}

          {/* Habit Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {habit.categoryIcon && <span className="text-xl">{habit.categoryIcon}</span>}
              <h3
                className={`font-semibold text-gray-900 ${habit.completed ? 'line-through text-gray-500' : ''}`}
              >
                {habit.name}
              </h3>
            </div>

            {habit.description && <p className="text-sm text-gray-600 mb-2">{habit.description}</p>}

            {/* Progress for Numeric */}
            {habit.type === 'NUMERIC' && habit.targetValue && (
              <div className="mb-2">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600">
                    {numericValue} / {habit.targetValue} {habit.unit || 'unidades'}
                  </span>
                  <span className="text-gray-500">
                    {Math.round((numericValue / habit.targetValue) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min((numericValue / habit.targetValue) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Streak Badge */}
            {habit.currentStreak > 0 && (
              <div className="inline-flex items-center gap-1 text-xs font-medium text-orange-700 bg-orange-100 px-2 py-1 rounded-full mb-2">
                🔥 {habit.currentStreak} días
              </div>
            )}

            {/* Notes Toggle */}
            <button
              onClick={() => setShowNotes(!showNotes)}
              className="text-xs text-indigo-600 hover:text-indigo-500 font-medium"
            >
              {showNotes ? '− Ocultar notas' : '+ Agregar notas'}
            </button>

            {/* Notes Input */}
            {showNotes && (
              <div className="mt-2">
                <textarea
                  value={notesValue}
                  onChange={(e) => setNotesValue(e.target.value)}
                  onBlur={handleNotesBlur}
                  placeholder="Escribe tus notas aquí..."
                  className="w-full p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={2}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
