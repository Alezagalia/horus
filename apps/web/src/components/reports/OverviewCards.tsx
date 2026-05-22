/**
 * Reports - Overview Cards
 * F-07 - Reportes y Tendencias
 * Sprint 15 - US-147
 */

import type { AnalyticsOverview } from '@horus/shared';

interface OverviewCardsProps {
  data?: AnalyticsOverview;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

const currency = (n: number): string =>
  n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

const percent = (n: number): string => `${Math.round(n * 100)}%`;

function Skeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-32 rounded-xl bg-gray-100 animate-pulse" />
      ))}
    </div>
  );
}

interface CardProps {
  title: string;
  emoji: string;
  primary: string;
  secondary: string;
  gradient: string;
}

function Card({ title, emoji, primary, secondary, gradient }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          {title}
        </span>
        <div
          className={`w-9 h-9 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-lg`}
        >
          {emoji}
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900">{primary}</div>
      <div className="text-sm text-gray-500 mt-1">{secondary}</div>
    </div>
  );
}

export function OverviewCards({ data, isLoading, isError, onRetry }: OverviewCardsProps) {
  if (isLoading) return <Skeleton />;

  if (isError || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-red-700 font-medium mb-3">No se pudo cargar el resumen</p>
        <button
          type="button"
          onClick={onRetry}
          className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const { habits, tasks, finance, workouts, goals } = data;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <Card
        title="Hábitos"
        emoji="🎯"
        gradient="from-blue-500 to-cyan-500"
        primary={habits.totalCompletions.toString()}
        secondary={`${percent(habits.completionRate)} adherencia · racha máx ${habits.longestStreakInPeriod}`}
      />
      <Card
        title="Tareas"
        emoji="✅"
        gradient="from-amber-500 to-orange-500"
        primary={tasks.completed.toString()}
        secondary={`${tasks.pending} pendientes · ${tasks.overdue} atrasadas`}
      />
      <Card
        title="Balance"
        emoji="💸"
        gradient="from-green-500 to-emerald-500"
        primary={currency(finance.net)}
        secondary={`+${currency(finance.income)} / -${currency(finance.expense)}`}
      />
      <Card
        title="Workouts"
        emoji="💪"
        gradient="from-orange-500 to-red-500"
        primary={workouts.completed.toString()}
        secondary={`Volumen total ${workouts.totalVolume.toLocaleString('es-AR')} kg`}
      />
      <Card
        title="Metas"
        emoji="🏆"
        gradient="from-amber-500 to-yellow-500"
        primary={goals.active.toString()}
        secondary={`${percent(goals.averageProgress)} progreso · ${goals.completedInPeriod} completadas`}
      />
    </div>
  );
}
