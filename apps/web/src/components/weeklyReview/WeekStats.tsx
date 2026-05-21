/**
 * WeekStats - Cards de estadísticas de la semana (F-03)
 */

import type { WeeklyStats } from '@horus/shared';

interface WeekStatsProps {
  stats: WeeklyStats;
}

export function WeekStats({ stats }: WeekStatsProps) {
  const { habits, tasks, finance, goals, events } = stats;

  return (
    <div className="space-y-4">
      {/* Hábitos */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎯</span>
            <h3 className="text-sm font-semibold text-gray-700">Hábitos</h3>
          </div>
          <span className="text-sm font-bold text-blue-600">{habits.rate}%</span>
        </div>
        <p className="text-2xl font-bold text-gray-900 mb-2">
          {habits.completed}
          <span className="text-base font-normal text-gray-400">
            {' '}
            / {habits.total * 7} posibles
          </span>
        </p>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(habits.rate, 100)}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1">{habits.total} hábitos activos</p>
      </div>

      {/* Tareas */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">✅</span>
          <h3 className="text-sm font-semibold text-gray-700">Tareas</h3>
        </div>
        <p className="text-2xl font-bold text-gray-900">
          {tasks.completed}
          <span className="text-base font-normal text-gray-400"> completadas</span>
        </p>
      </div>

      {/* Finanzas */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">💸</span>
          <h3 className="text-sm font-semibold text-gray-700">Finanzas</h3>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Ingresos</span>
            <span className="text-sm font-semibold text-green-600">
              +${finance.income.toLocaleString('es', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Egresos</span>
            <span className="text-sm font-semibold text-red-500">
              -${finance.expenses.toLocaleString('es', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="border-t border-gray-100 pt-2 flex justify-between items-center">
            <span className="text-xs font-semibold text-gray-600">Balance</span>
            <span
              className={`text-sm font-bold ${finance.balance >= 0 ? 'text-green-600' : 'text-red-500'}`}
            >
              {finance.balance >= 0 ? '+' : ''}$
              {finance.balance.toLocaleString('es', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Metas */}
      {goals.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">🏆</span>
            <h3 className="text-sm font-semibold text-gray-700">Metas activas</h3>
          </div>
          <div className="space-y-3">
            {goals.map((goal) => (
              <div key={goal.id}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-600 truncate flex-1 mr-2">{goal.title}</span>
                  <span className="text-xs font-semibold text-amber-600">{goal.progress}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-yellow-400 h-1.5 rounded-full"
                    style={{ width: `${goal.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Eventos */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">📅</span>
          <h3 className="text-sm font-semibold text-gray-700">Eventos</h3>
        </div>
        <p className="text-2xl font-bold text-gray-900">
          {events.completed}
          <span className="text-base font-normal text-gray-400"> / {events.total}</span>
        </p>
        <p className="text-xs text-gray-400 mt-0.5">completados esta semana</p>
      </div>
    </div>
  );
}
