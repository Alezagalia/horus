/**
 * Total Balance Card Component
 * Sprint 13 - US-119
 */

import type { Account, Currency } from '@horus/shared';
import { formatCurrency } from '@/utils/currency';

interface TotalBalanceCardProps {
  accounts: Account[];
}

export function TotalBalanceCard({ accounts }: TotalBalanceCardProps) {
  // Group accounts by currency and sum balances
  const balancesByCurrency = accounts
    .filter((acc) => acc.isActive)
    .reduce(
      (acc, account) => {
        const currency = account.currency;
        acc[currency] = (acc[currency] || 0) + account.currentBalance;
        return acc;
      },
      {} as Record<Currency, number>
    );

  const currencyEntries = Object.entries(balancesByCurrency) as [Currency, number][];

  return (
    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold opacity-90">Saldo Total</h2>
        <svg className="w-8 h-8 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>

      {currencyEntries.length === 0 ? (
        <p className="text-2xl font-bold opacity-75">Sin cuentas activas</p>
      ) : (
        <div className="space-y-2">
          {currencyEntries.map(([currency, total]) => (
            <div key={currency} className="flex items-baseline justify-between">
              <span className="text-sm font-medium opacity-90">{currency}</span>
              <span className="text-2xl font-bold">{formatCurrency(total, currency)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
