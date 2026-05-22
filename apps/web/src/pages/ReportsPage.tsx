/**
 * Reports Page
 * F-07 - Reportes y Tendencias
 * Sprint 15 - US-147
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAnalyticsRange } from '@/hooks/useAnalyticsRange';
import { useOverview } from '@/hooks/useAnalytics';
import { RangeSelector } from '@/components/reports/RangeSelector';
import { OverviewCards } from '@/components/reports/OverviewCards';
import { CompareTable } from '@/components/reports/CompareTable';
import { HabitsTab } from '@/components/reports/HabitsTab';
import { FinanceTab } from '@/components/reports/FinanceTab';
import { ProductivityTab } from '@/components/reports/ProductivityTab';

type TabId = 'overview' | 'habits' | 'finance' | 'productivity' | 'compare' | 'fitness';

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'habits', label: 'Hábitos' },
  { id: 'finance', label: 'Finanzas' },
  { id: 'productivity', label: 'Productividad' },
  { id: 'compare', label: 'Comparativo' },
  { id: 'fitness', label: 'Fitness' },
];

function FitnessRedirect() {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-12 text-center">
      <div className="text-5xl mb-4">💪</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Estadísticas de Fitness</h3>
      <p className="text-sm text-gray-500 mb-6">
        Las métricas de workouts se mantienen en su página dedicada.
      </p>
      <Link
        to="/stats"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold shadow-md hover:shadow-lg transition-shadow"
      >
        Ver detalle
        <span aria-hidden>→</span>
      </Link>
    </div>
  );
}

export function ReportsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const { range, selectPreset, setCustomRange } = useAnalyticsRange('30d');

  const overviewQuery = useOverview(range.from, range.to);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Reportes</h1>
          <p className="text-sm text-gray-500 mt-1">Análisis integral de tu actividad</p>
        </div>
        {(activeTab === 'overview' || activeTab === 'productivity') && (
          <RangeSelector
            preset={range.presetId}
            from={range.from}
            to={range.to}
            onPreset={selectPreset}
            onCustom={setCustomRange}
          />
        )}
      </header>

      <nav className="flex gap-1 overflow-x-auto rounded-xl bg-gray-100 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <section>
        {activeTab === 'overview' && (
          <OverviewCards
            data={overviewQuery.data}
            isLoading={overviewQuery.isLoading}
            isError={overviewQuery.isError}
            onRetry={() => overviewQuery.refetch()}
          />
        )}
        {activeTab === 'habits' && <HabitsTab />}
        {activeTab === 'finance' && <FinanceTab />}
        {activeTab === 'productivity' && <ProductivityTab from={range.from} to={range.to} />}
        {activeTab === 'compare' && <CompareTable />}
        {activeTab === 'fitness' && <FitnessRedirect />}
      </section>
    </div>
  );
}
