/**
 * Habit Statistics Page
 * Sprint 11 - US-100
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { StreakCard } from '@/components/habitStats/StreakCard';
import { CompletionRateCard } from '@/components/habitStats/CompletionRateCard';
import { EvolutionChart } from '@/components/habitStats/EvolutionChart';
import { HabitCalendar } from '@/components/habitStats/HabitCalendar';
import type { HabitStats } from '@/types/habitStats';

// Mock data generator
const getMockHabitStats = (habitId: string): HabitStats | null => {
  const habits: { [key: string]: HabitStats } = {
    '1': {
      habitId: '1',
      habitName: 'Meditar 10 minutos',
      habitType: 'CHECK',
      categoryIcon: '🧘',
      categoryColor: '#8B5CF6',
      streaks: {
        current: 12,
        longest: 25,
      },
      completionRate: {
        overall: 85,
        last30Days: 87,
        last7Days: 100,
      },
      dailyCompletions: generateDailyCompletions(30, 'CHECK', 0.87),
      calendarData: generateCalendarData(30, 'CHECK', 0.87),
    },
    '2': {
      habitId: '2',
      habitName: 'Tomar agua',
      habitType: 'NUMERIC',
      categoryIcon: '💧',
      categoryColor: '#06B6D4',
      unit: 'vasos',
      streaks: {
        current: 5,
        longest: 15,
      },
      completionRate: {
        overall: 78,
        last30Days: 80,
        last7Days: 71,
      },
      dailyCompletions: generateDailyCompletionsNumeric(30, 8, 'vasos'),
      calendarData: generateCalendarData(30, 'NUMERIC', 0.8),
    },
    '3': {
      habitId: '3',
      habitName: 'Hacer ejercicio',
      habitType: 'CHECK',
      categoryIcon: '💪',
      categoryColor: '#EF4444',
      streaks: {
        current: 7,
        longest: 18,
      },
      completionRate: {
        overall: 82,
        last30Days: 85,
        last7Days: 85,
      },
      dailyCompletions: generateDailyCompletions(30, 'CHECK', 0.85),
      calendarData: generateCalendarData(30, 'CHECK', 0.85),
    },
    '4': {
      habitId: '4',
      habitName: 'Leer 30 páginas',
      habitType: 'NUMERIC',
      categoryIcon: '📚',
      categoryColor: '#3B82F6',
      unit: 'páginas',
      streaks: {
        current: 8,
        longest: 22,
      },
      completionRate: {
        overall: 88,
        last30Days: 90,
        last7Days: 100,
      },
      dailyCompletions: generateDailyCompletionsNumeric(30, 30, 'páginas'),
      calendarData: generateCalendarData(30, 'NUMERIC', 0.9),
    },
  };

  return habits[habitId] || null;
};

function generateDailyCompletions(
  days: number,
  _type: 'CHECK',
  completionRate: number
): HabitStats['dailyCompletions'] {
  const result = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    result.push({
      date: dateStr,
      completed: Math.random() < completionRate,
    });
  }

  return result;
}

function generateDailyCompletionsNumeric(
  days: number,
  targetValue: number,
  _unit: string
): HabitStats['dailyCompletions'] {
  const result = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const value = Math.round(targetValue * (0.5 + Math.random() * 0.7));
    const completed = value >= targetValue;

    result.push({
      date: dateStr,
      completed,
      value,
      targetValue,
    });
  }

  return result;
}

function generateCalendarData(
  days: number,
  type: 'CHECK' | 'NUMERIC',
  completionRate: number
): HabitStats['calendarData'] {
  const result = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const completed = Math.random() < completionRate;

    result.push({
      date: dateStr,
      status: completed ? ('completed' as const) : ('missed' as const),
      value: type === 'NUMERIC' ? Math.round(Math.random() * 100) : undefined,
    });
  }

  return result;
}

export function HabitStatsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading] = useState(false);

  const stats = id ? getMockHabitStats(id) : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-white rounded-lg shadow border border-gray-200 p-8">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Hábito no encontrado</h2>
          <p className="text-gray-600 mb-4">No se encontraron estadísticas para este hábito.</p>
          <button
            onClick={() => navigate('/habits')}
            className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
          >
            Volver a Mis Hábitos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/habits')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Volver
        </button>

        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-lg flex items-center justify-center text-3xl"
            style={{
              backgroundColor: stats.categoryColor ? `${stats.categoryColor}20` : '#F3F4F6',
            }}
          >
            {stats.categoryIcon || '📊'}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{stats.habitName}</h1>
            <p className="text-gray-600 mt-1">Estadísticas detalladas de tu hábito</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="space-y-6">
        {/* Streaks */}
        <StreakCard streaks={stats.streaks} />

        {/* Completion Rate */}
        <CompletionRateCard completionRate={stats.completionRate} />

        {/* Evolution Chart */}
        <EvolutionChart
          dailyCompletions={stats.dailyCompletions}
          habitType={stats.habitType}
          unit={stats.unit}
        />

        {/* Calendar */}
        <HabitCalendar
          calendarData={stats.calendarData}
          habitType={stats.habitType}
          unit={stats.unit}
        />
      </div>
    </div>
  );
}
