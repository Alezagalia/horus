/**
 * Expenses by Category Chart Component
 * Shows a pie chart with expenses grouped by category
 */

import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useExpensesByCategory } from '@/hooks/useTransactions';
import { formatCurrency } from '@/utils/currency';

const COLORS = [
  '#EF4444', // red-500
  '#F59E0B', // amber-500
  '#10B981', // green-500
  '#3B82F6', // blue-500
  '#8B5CF6', // purple-500
  '#EC4899', // pink-500
  '#06B6D4', // cyan-500
  '#84CC16', // lime-500
  '#F97316', // orange-500
  '#6366F1', // indigo-500
];

export function ExpensesByCategoryChart() {
  const today = new Date();
  const month = today.getMonth() + 1; // getMonth() returns 0-11, we need 1-12
  const year = today.getFullYear();

  const { data, isLoading } = useExpensesByCategory(month, year);

  const chartData = useMemo(() => {
    if (!data?.categories) return [];

    return data.categories.map((category) => ({
      name: category.categoryName,
      icon: category.categoryIcon,
      value: category.totalAmount,
      count: category.transactionCount,
    }));
  }, [data]);

  const totalExpenses = useMemo(() => {
    return data?.total ?? 0;
  }, [data]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Gastos por Categoría</h3>
        <div className="flex items-center justify-center h-[300px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Gastos por Categoría</h3>
        <div className="flex flex-col items-center justify-center h-[300px] text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-gray-600">No hay gastos este mes</p>
          <p className="text-sm text-gray-500 mt-1">Los gastos aparecerán aquí cuando realices transacciones</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Gastos por Categoría</h3>
        <div className="text-right">
          <p className="text-sm text-gray-500">Total del mes</p>
          <p className="text-xl font-bold text-red-600">
            {formatCurrency(totalExpenses, 'ARS')}
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Chart */}
        <div className="flex-1 min-h-[300px]">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                        <p className="font-semibold text-gray-900">
                          {data.icon} {data.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {data.count} gasto{data.count !== 1 ? 's' : ''}
                        </p>
                        <p className="text-lg font-bold text-red-600">
                          {formatCurrency(data.value, 'ARS')}
                        </p>
                        <p className="text-xs text-gray-500">
                          {((data.value / totalExpenses) * 100).toFixed(1)}% del total
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend List */}
        <div className="lg:w-64">
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {chartData.map((item, index) => (
              <div
                key={item.name}
                className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 transition-colors"
              >
                <div
                  className="w-4 h-4 rounded flex-shrink-0"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {item.icon} {item.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {item.count} gasto{item.count !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(item.value, 'ARS')}
                  </p>
                  <p className="text-xs text-gray-500">
                    {((item.value / totalExpenses) * 100).toFixed(0)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
