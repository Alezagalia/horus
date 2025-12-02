/**
 * Evolution Chart Component
 * Sprint 11 - US-100
 */

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { DailyCompletion } from '@/types/habitStats';

interface EvolutionChartProps {
  dailyCompletions: DailyCompletion[];
  habitType: 'CHECK' | 'NUMERIC';
  unit?: string;
}

export function EvolutionChart({ dailyCompletions, habitType, unit }: EvolutionChartProps) {
  // Format data for charts
  const chartData = dailyCompletions.map((day) => {
    const date = new Date(day.date);
    const formattedDate = `${date.getDate()}/${date.getMonth() + 1}`;

    if (habitType === 'CHECK') {
      return {
        date: formattedDate,
        fullDate: day.date,
        completed: day.completed ? 1 : 0,
        status: day.completed ? 'Completado' : 'No completado',
      };
    } else {
      return {
        date: formattedDate,
        fullDate: day.date,
        value: day.value || 0,
        target: day.targetValue || 0,
        status: `${day.value || 0} ${unit || 'u'}`,
      };
    }
  });

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Evolución (Últimos 30 días)</h2>

      <ResponsiveContainer width="100%" height={300}>
        {habitType === 'CHECK' ? (
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              domain={[0, 1]}
              ticks={[0, 1]}
              tickFormatter={(value) => (value === 1 ? 'Sí' : 'No')}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickLine={{ stroke: '#e5e7eb' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              labelStyle={{ color: '#374151', fontWeight: 'bold' }}
              formatter={(_value, _name, props) => [props.payload.status, '']}
            />
            <Bar
              dataKey="completed"
              fill="#10b981"
              radius={[4, 4, 0, 0]}
              background={{ fill: '#f3f4f6' }}
            />
          </BarChart>
        ) : (
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} tickLine={{ stroke: '#e5e7eb' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              labelStyle={{ color: '#374151', fontWeight: 'bold' }}
              formatter={(value: number) => [`${value} ${unit || 'u'}`, '']}
            />
            <Legend
              wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
              iconType="line"
              formatter={(value) => {
                if (value === 'value') return `Valor (${unit || 'u'})`;
                if (value === 'target') return 'Objetivo';
                return value;
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="target"
              stroke="#f59e0b"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
          </LineChart>
        )}
      </ResponsiveContainer>

      <div className="mt-4 flex items-center justify-center gap-4 text-sm text-gray-600">
        {habitType === 'CHECK' ? (
          <>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded" />
              <span>Completado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-200 rounded" />
              <span>No completado</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-blue-500" />
              <span>Valor ({unit || 'u'})</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-0.5 bg-orange-500 border-dashed"
                style={{ borderTop: '2px dashed' }}
              />
              <span>Objetivo</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
