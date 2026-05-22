/**
 * Insights Page
 * F-12 - Motor de Correlaciones Personales
 * Sprint 18
 */

import { useCallback } from 'react';
import { useDismissInsight, useInsights, useMarkSeenInsight } from '@/hooks/useInsights';
import { InsightCard } from '@/components/insights/InsightCard';

export function InsightsPage() {
  const { data, isLoading, isError, refetch } = useInsights();
  const dismiss = useDismissInsight();
  const markSeen = useMarkSeenInsight();

  const handleDismiss = useCallback((id: string) => dismiss.mutate(id), [dismiss]);
  const handleMarkSeen = useCallback((id: string) => markSeen.mutate(id), [markSeen]);

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-3xl mx-auto">
      <header>
        <h1 className="text-3xl font-bold text-gradient">Insights</h1>
        <p className="text-sm text-gray-500 mt-1">
          Patrones detectados al cruzar tus datos. Sin IA — solo lo que tus números dicen.
        </p>
      </header>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-red-700 font-medium mb-2">No se pudo calcular tus insights.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700"
          >
            Reintentar
          </button>
        </div>
      )}

      {!isLoading && !isError && data && (
        <>
          {data.notEnoughData ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-12 text-center">
              <div className="text-5xl mb-4">⏳</div>
              <h3 className="text-lg font-semibold text-amber-900 mb-1">
                Aún no hay suficientes datos
              </h3>
              <p className="text-sm text-amber-700">
                Llevamos {data.daysOfData} {data.daysOfData === 1 ? 'día' : 'días'} de tu actividad.
                Necesitamos al menos 60 para detectar patrones confiables.
              </p>
            </div>
          ) : data.insights.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center">
              <div className="text-5xl mb-4">🌱</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Sin patrones detectados todavía
              </h3>
              <p className="text-sm text-gray-500">
                Volvé pronto. Seguimos buscando correlaciones en tus datos.
              </p>
            </div>
          ) : (
            <ul className="space-y-4">
              {data.insights.map((insight) => (
                <li key={insight.id}>
                  <InsightCard
                    insight={insight}
                    onDismiss={handleDismiss}
                    onMarkSeen={handleMarkSeen}
                  />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
