/**
 * ProductivityBars — bars by day-of-week and by hour-of-day
 * F-07 - Reportes y Tendencias
 * Sprint 15 - US-149
 */

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Productivity } from '@horus/shared';

interface ProductivityBarsProps {
  data: Productivity;
}

const DAY_NAMES_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const PRIMARY = '#4f46e5';
const MUTED = '#c7d2fe';

export function ProductivityBars({ data }: ProductivityBarsProps) {
  const dowData = data.byDayOfWeek.map((d) => ({
    name: DAY_NAMES_SHORT[d.dayOfWeek],
    completed: d.completed,
    isBest: data.bestDayOfWeek?.dayOfWeek === d.dayOfWeek && d.completed > 0,
  }));

  const hourData = data.byHourOfDay.map((h) => ({
    name: `${String(h.hour).padStart(2, '0')}h`,
    completed: h.completed,
    isBest: data.bestHour?.hour === h.hour && h.completed > 0,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Por día de la semana</h4>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={dowData}
            layout="vertical"
            margin={{ top: 0, right: 12, bottom: 0, left: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis type="number" fontSize={11} stroke="#6b7280" />
            <YAxis dataKey="name" type="category" width={40} fontSize={11} stroke="#6b7280" />
            <Tooltip />
            <Bar dataKey="completed" radius={[0, 4, 4, 0]}>
              {dowData.map((entry, i) => (
                <Cell key={i} fill={entry.isBest ? PRIMARY : MUTED} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Por hora del día</h4>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={hourData} margin={{ top: 0, right: 8, bottom: 0, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" fontSize={11} stroke="#6b7280" interval={1} />
            <YAxis fontSize={11} stroke="#6b7280" />
            <Tooltip />
            <Bar dataKey="completed" radius={[4, 4, 0, 0]}>
              {hourData.map((entry, i) => (
                <Cell key={i} fill={entry.isBest ? PRIMARY : MUTED} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
