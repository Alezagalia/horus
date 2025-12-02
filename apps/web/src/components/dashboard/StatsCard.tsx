/**
 * Statistics Card Component
 * Sprint 11 - US-097
 */

import { Card } from './Card';
import type { DashboardStats } from '@/types/dashboard';

interface StatsCardProps {
  stats: DashboardStats;
}

export function StatsCard({ stats }: StatsCardProps) {
  const statItems = [
    {
      label: 'Hábitos Activos',
      value: stats.activeHabits,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Tareas Pendientes',
      value: stats.pendingTasks,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      label: 'Tareas Vencidas',
      value: stats.overdueTasks,
      color: stats.overdueTasks > 0 ? 'text-red-600' : 'text-gray-600',
      bgColor: stats.overdueTasks > 0 ? 'bg-red-50' : 'bg-gray-50',
    },
  ];

  return (
    <Card title="Estadísticas Rápidas">
      <div className="space-y-4">
        {statItems.map((stat) => (
          <div key={stat.label} className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{stat.label}</span>
            <div
              className={`${stat.bgColor} ${stat.color} px-3 py-1 rounded-full font-semibold text-sm`}
            >
              {stat.value}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
