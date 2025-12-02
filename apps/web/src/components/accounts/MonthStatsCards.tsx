/**
 * Month Stats Cards Component
 * Sprint 13 - US-119
 */

import { useFinanceStats } from '@/hooks/useAccounts';
import { formatCurrency } from '@/utils/currency';
import type { Currency } from '@horus/shared';

export function MonthStatsCards() {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const { data: stats, isLoading } = useFinanceStats(currentMonth, currentYear);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-lg shadow border border-gray-200 p-6 animate-pulse"
          >
            <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-32"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const balance = stats.balance;
  const isPositive = balance >= 0;

  const cards = [
    {
      title: 'Ingresos del Mes',
      amount: stats.totalIncome,
      color: 'green',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
        />
      ),
    },
    {
      title: 'Egresos del Mes',
      amount: stats.totalExpense,
      color: 'red',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
        />
      ),
    },
    {
      title: 'Balance',
      amount: balance,
      color: isPositive ? 'green' : 'red',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      ),
    },
  ];

  const colorClasses = {
    green: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: 'text-green-600',
      text: 'text-green-700',
    },
    red: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: 'text-red-600',
      text: 'text-red-700',
    },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map((card, index) => {
        const colors = colorClasses[card.color as keyof typeof colorClasses];
        return (
          <div
            key={index}
            className={`${colors.bg} border ${colors.border} rounded-lg shadow-sm p-6`}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className={`text-sm font-medium ${colors.text}`}>{card.title}</h3>
              <svg
                className={`w-6 h-6 ${colors.icon}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {card.icon}
              </svg>
            </div>
            <p className={`text-2xl font-bold ${colors.text}`}>
              {formatCurrency(card.amount, stats.currency as Currency)}
            </p>
          </div>
        );
      })}
    </div>
  );
}
