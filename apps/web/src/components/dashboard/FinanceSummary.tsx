/**
 * FinanceSummary — Salud financiera
 * Tres bloques: saldo + balance del mes (por moneda), presupuesto vs gastado,
 * y progreso de metas de ahorro. Reutiliza endpoints existentes.
 *
 * Multimoneda: los saldos y el balance del mes se agrupan POR MONEDA
 * (nunca se suman ARS + USD), igual que el resto de la app.
 */

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { startOfMonth, endOfMonth } from 'date-fns';
import { useAccounts } from '@/hooks/useAccounts';
import { useTransactions } from '@/hooks/useTransactions';
import { useBudgetsSummary } from '@/hooks/useBudgets';
import { useSavingsGoals } from '@/hooks/useSavingsGoals';
import { formatCurrency } from '@/utils/currency';
import type { Currency } from '@horus/shared';

interface CurrencyBucket {
  currency: string;
  saldo: number;
  income: number;
  expense: number;
}

const MAX_BUDGETS = 4;
const MAX_GOALS = 3;

/** Color de la barra de presupuesto según el % gastado. */
function budgetBarColor(pct: number): string {
  if (pct >= 100) return 'bg-red-500';
  if (pct >= 80) return 'bg-amber-500';
  return 'bg-indigo-500';
}

export function FinanceSummary() {
  const navigate = useNavigate();

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const monthRange = useMemo(
    () => ({ from: startOfMonth(now).toISOString(), to: endOfMonth(now).toISOString() }),
    [month, year]
  );

  const { data: accounts = [], isLoading: accountsLoading } = useAccounts();
  const { data: txData } = useTransactions(monthRange);
  const { data: budgetData } = useBudgetsSummary(month, year);
  const { data: savingsData } = useSavingsGoals();

  // accountId -> currency, para imputar cada transacción a su moneda
  const accountCurrency = useMemo(() => {
    const map = new Map<string, string>();
    accounts.forEach((a) => map.set(a.id, a.currency));
    return map;
  }, [accounts]);

  // Saldo + ingresos/egresos del mes, agrupado por moneda
  const buckets = useMemo<CurrencyBucket[]>(() => {
    const map = new Map<string, CurrencyBucket>();
    const get = (currency: string): CurrencyBucket => {
      if (!map.has(currency)) map.set(currency, { currency, saldo: 0, income: 0, expense: 0 });
      return map.get(currency)!;
    };

    accounts
      .filter((a) => a.isActive)
      .forEach((a) => {
        get(a.currency).saldo += Number(a.currentBalance) || 0;
      });

    (txData?.transactions ?? []).forEach((tx) => {
      const currency = accountCurrency.get(tx.accountId);
      if (!currency) return;
      const amount = Number(tx.amount) || 0;
      const bucket = get(currency);
      if (tx.type === 'ingreso') bucket.income += amount;
      else bucket.expense += amount;
    });

    return Array.from(map.values()).sort((a, b) => b.saldo - a.saldo);
  }, [accounts, txData, accountCurrency]);

  // Presupuestos del mes (top por % gastado)
  const budgets = useMemo(() => {
    const summary = budgetData?.summary ?? [];
    return [...summary]
      .sort((a, b) => Number(b.percentage) - Number(a.percentage))
      .slice(0, MAX_BUDGETS);
  }, [budgetData]);

  // Metas de ahorro en progreso (top por % de avance)
  const goals = useMemo(() => {
    const all = savingsData?.savingsGoals ?? [];
    return all
      .filter((g) => g.status === 'en_progreso')
      .sort((a, b) => Number(b.progress) - Number(a.progress))
      .slice(0, MAX_GOALS);
  }, [savingsData]);

  return (
    <div
      className="glass-card p-6 animate-slide-up opacity-0 delay-300"
      style={{ animationFillMode: 'forwards' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Finanzas</h2>
          <p className="text-sm text-gray-500">Saldo, presupuesto y ahorro</p>
        </div>
        <button
          onClick={() => navigate('/reports')}
          className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          Ver reportes →
        </button>
      </div>

      <div className="space-y-6">
        {/* Presupuesto + Ahorro arriba */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ── Bloque B: Presupuesto del mes ── */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Presupuesto del mes</h3>
              <button
                onClick={() => navigate('/budgets')}
                className="text-xs text-indigo-600 hover:text-indigo-700"
              >
                Ver todos
              </button>
            </div>

            {budgets.length === 0 ? (
              <div className="text-center py-6">
                <div className="text-3xl mb-2 opacity-40">📊</div>
                <p className="text-sm text-gray-500">Sin presupuestos este mes</p>
                <button
                  onClick={() => navigate('/budgets')}
                  className="mt-2 text-xs text-indigo-600 hover:text-indigo-500"
                >
                  Crear presupuesto
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {budgets.map((b) => {
                  const spent = Number(b.spent) || 0;
                  const amount = Number(b.amount) || 0;
                  const pct = Number(b.percentage) || 0;
                  return (
                    <div key={b.id}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-medium text-gray-700 truncate flex items-center gap-1">
                          <span>{b.category?.icon || '📄'}</span>
                          <span className="truncate">{b.category?.name || 'Categoría'}</span>
                        </span>
                        <span
                          className={pct >= 100 ? 'text-red-600 font-semibold' : 'text-gray-500'}
                        >
                          {formatCurrency(spent, b.currency as Currency)} /{' '}
                          {formatCurrency(amount, b.currency as Currency)}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${budgetBarColor(pct)}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* ── Bloque C: Metas de ahorro ── */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Metas de ahorro</h3>
              <button
                onClick={() => navigate('/savings-goals')}
                className="text-xs text-indigo-600 hover:text-indigo-700"
              >
                Ver todas
              </button>
            </div>

            {goals.length === 0 ? (
              <div className="text-center py-6">
                <div className="text-3xl mb-2 opacity-40">🎯</div>
                <p className="text-sm text-gray-500">Sin metas de ahorro</p>
                <button
                  onClick={() => navigate('/savings-goals')}
                  className="mt-2 text-xs text-indigo-600 hover:text-indigo-500"
                >
                  Crear meta
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {goals.map((g) => {
                  const saved = Number(g.savedAmount) || 0;
                  const target = Number(g.targetAmount) || 0;
                  const pct = Number(g.progress) || 0;
                  const currency = g.account?.currency as Currency;
                  return (
                    <div key={g.id}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-medium text-gray-700 truncate">{g.name}</span>
                        <span className="text-gray-500 font-semibold">{Math.round(pct)}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-green-500 transition-all"
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1">
                        {formatCurrency(saved, currency)} / {formatCurrency(target, currency)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* ── Saldo + balance del mes (por moneda), debajo ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">Saldo y mes</h3>
            <button
              onClick={() => navigate('/accounts')}
              className="text-xs text-indigo-600 hover:text-indigo-700"
            >
              Cuentas
            </button>
          </div>

          {accountsLoading ? (
            <p className="text-sm text-gray-400">Cargando…</p>
          ) : buckets.length === 0 ? (
            <p className="text-sm text-gray-400">Sin cuentas activas</p>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {buckets.map((b) => {
                  const net = b.income - b.expense;
                  return (
                    <div key={b.currency} className="rounded-xl bg-gray-50 p-3">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs font-medium text-gray-500">{b.currency}</span>
                        <span className="text-lg font-bold text-gray-900">
                          {formatCurrency(b.saldo, b.currency as Currency)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1.5 text-xs">
                        <span className="text-green-600">
                          ↑ {formatCurrency(b.income, b.currency as Currency)}
                        </span>
                        <span className="text-red-500">
                          ↓ {formatCurrency(b.expense, b.currency as Currency)}
                        </span>
                        <span
                          className={`font-semibold ${net >= 0 ? 'text-green-700' : 'text-red-600'}`}
                        >
                          {net >= 0 ? '+' : ''}
                          {formatCurrency(net, b.currency as Currency)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-[11px] text-gray-400 mt-2">
                ↑ ingresos · ↓ egresos · balance del mes
              </p>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
