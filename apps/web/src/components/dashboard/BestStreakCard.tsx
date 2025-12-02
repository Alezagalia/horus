/**
 * Best Streak Card Component
 * Sprint 11 - US-097
 */

import { Card } from './Card';
import type { BestStreak } from '@/types/dashboard';

interface BestStreakCardProps {
  bestStreak: BestStreak | null;
}

export function BestStreakCard({ bestStreak }: BestStreakCardProps) {
  return (
    <Card title="Tu Mejor Racha">
      {bestStreak ? (
        <div className="text-center py-6">
          <div className="text-6xl mb-4 animate-pulse">🔥</div>
          <div className="mb-3">
            <div className="text-5xl font-bold text-orange-600 mb-1">{bestStreak.streakDays}</div>
            <div className="text-sm text-gray-500 uppercase tracking-wide">días</div>
          </div>
          <p className="text-lg font-medium text-gray-900">{bestStreak.habitName}</p>
          <p className="text-sm text-gray-500 mt-1">¡Sigue así!</p>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-4xl mb-2 opacity-50">🔥</div>
          <p className="text-gray-500 text-sm">Aún no tienes rachas</p>
          <p className="text-xs text-gray-400 mt-1">
            Completa hábitos diarios para construir tu racha
          </p>
        </div>
      )}
    </Card>
  );
}
