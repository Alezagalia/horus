/**
 * Progress Bar Component
 * Sprint 11 - US-098
 */

import type { DayProgress } from '@/types/habits';

interface ProgressBarProps {
  progress: DayProgress;
}

export function ProgressBar({ progress }: ProgressBarProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">Progreso del Día</span>
        <span className="text-sm font-semibold text-gray-900">
          {progress.completed}/{progress.total} completados ({progress.percentage}%)
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className={`h-3 rounded-full transition-all duration-500 ${
            progress.percentage === 100
              ? 'bg-green-500'
              : progress.percentage >= 50
                ? 'bg-indigo-600'
                : 'bg-indigo-400'
          }`}
          style={{ width: `${progress.percentage}%` }}
        />
      </div>
      {progress.percentage === 100 && (
        <p className="text-sm text-green-600 font-medium mt-2">
          ¡Felicidades! Completaste todos tus hábitos del día 🎉
        </p>
      )}
    </div>
  );
}
