/**
 * Streak Card Component
 * Sprint 11 - US-100
 */

import type { StreakData } from '@/types/habitStats';

interface StreakCardProps {
  streaks: StreakData;
}

export function StreakCard({ streaks }: StreakCardProps) {
  const progress = streaks.longest > 0 ? (streaks.current / streaks.longest) * 100 : 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Rachas</h2>

      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Current Streak */}
        <div className="text-center">
          <div className="text-5xl mb-2">🔥</div>
          <div className="text-3xl font-bold text-orange-600 mb-1">{streaks.current}</div>
          <div className="text-sm text-gray-600">Racha Actual</div>
          <div className="text-xs text-gray-500 mt-1">días consecutivos</div>
        </div>

        {/* Longest Streak */}
        <div className="text-center">
          <div className="text-5xl mb-2">🏆</div>
          <div className="text-3xl font-bold text-yellow-600 mb-1">{streaks.longest}</div>
          <div className="text-sm text-gray-600">Récord Personal</div>
          <div className="text-xs text-gray-500 mt-1">mejor racha</div>
        </div>
      </div>

      {/* Progress Bar */}
      {streaks.longest > 0 && (
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600">Progreso hacia tu récord</span>
            <span className="font-medium text-gray-900">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-orange-500 to-yellow-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          {streaks.current >= streaks.longest && streaks.current > 0 && (
            <p className="text-sm text-green-600 font-medium mt-2 text-center">
              🎉 ¡Nuevo récord personal!
            </p>
          )}
        </div>
      )}
    </div>
  );
}
