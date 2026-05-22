/**
 * Life Debt Page
 * F-14 - Deuda de Vida
 * Sprint 17
 */

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import type { LifeDebtDecisionKind, LifeDebtItem } from '@horus/shared';
import { useLifeDebt, useRecordDecision, useReviewRecurringExpense } from '@/hooks/useLifeDebt';
import { LifeDebtItemCard } from '@/components/lifeDebt/LifeDebtItemCard';
import { DecisionModal } from '@/components/lifeDebt/DecisionModal';

export function LifeDebtPage() {
  const { data, isLoading, isError, refetch } = useLifeDebt();
  const recordDecision = useRecordDecision();
  const reviewExpense = useReviewRecurringExpense();

  const [forcedOpen, setForcedOpen] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [decidableItems, setDecidableItems] = useState<LifeDebtItem[]>([]);

  // Compute decidable items (excludes recurring_expense — those have a one-click review).
  useEffect(() => {
    if (data) {
      setDecidableItems(data.items.filter((i) => i.type !== 'recurring_expense'));
    }
  }, [data]);

  // Reset modal when the page first loads with items.
  useEffect(() => {
    if (!isLoading && decidableItems.length > 0 && forcedOpen) {
      setActiveIndex(0);
    }
  }, [isLoading, decidableItems.length, forcedOpen]);

  const activeItem = forcedOpen ? decidableItems[activeIndex] : undefined;

  const handleSubmit = async (input: {
    decision: LifeDebtDecisionKind;
    commitDate?: string;
    reason?: string;
  }) => {
    if (!activeItem) return;
    await recordDecision.mutateAsync({
      itemType: activeItem.type,
      itemId: activeItem.id,
      decision: input.decision,
      commitDate: input.commitDate,
      reason: input.reason,
    });
    toast.success(
      input.decision === 'commit'
        ? 'Fecha comprometida'
        : input.decision === 'delegate'
          ? 'Delegado'
          : 'Eliminado'
    );

    // Move to next item, or close if we just resolved the last one.
    if (activeIndex + 1 >= decidableItems.length) {
      setForcedOpen(false);
    } else {
      setActiveIndex((idx) => idx + 1);
    }
  };

  const handleReview = (item: LifeDebtItem) => {
    reviewExpense.mutate(item.id);
  };

  const handleDecideFromList = (item: LifeDebtItem) => {
    const idx = decidableItems.findIndex((i) => i.id === item.id);
    if (idx >= 0) {
      setActiveIndex(idx);
      setForcedOpen(true);
    }
  };

  const handleModalClose = () => {
    setForcedOpen(false);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-3xl mx-auto">
      <header>
        <h1 className="text-3xl font-bold text-gradient">Deuda de Vida</h1>
        <p className="text-sm text-gray-500 mt-1">
          Items que dejaste pendientes y necesitan una decisión clara.
        </p>
      </header>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-red-700 font-medium mb-2">No se pudo cargar tu deuda.</p>
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
          {data.items.length === 0 ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-12 text-center">
              <div className="text-5xl mb-4">🌿</div>
              <h3 className="text-lg font-semibold text-emerald-900 mb-1">Sin deuda pendiente</h3>
              <p className="text-sm text-emerald-700">
                Volvé pronto. Lo importante es no acumular.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3">
                <SummaryCard label="Tareas" count={data.totals.tasks} accent="amber" />
                <SummaryCard label="Hábitos" count={data.totals.habits} accent="blue" />
                <SummaryCard
                  label="Gastos recurrentes"
                  count={data.totals.recurringExpenses}
                  accent="emerald"
                />
              </div>

              <ul className="space-y-3">
                {data.items.map((item) => (
                  <li key={`${item.type}:${item.id}`}>
                    <LifeDebtItemCard
                      item={item}
                      onDecide={handleDecideFromList}
                      onReview={handleReview}
                    />
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}

      {activeItem && (
        <DecisionModal
          item={activeItem}
          index={activeIndex}
          total={decidableItems.length}
          onSubmit={handleSubmit}
          onClose={handleModalClose}
          isSubmitting={recordDecision.isPending}
        />
      )}
    </div>
  );
}

interface SummaryCardProps {
  label: string;
  count: number;
  accent: 'amber' | 'blue' | 'emerald';
}

const ACCENT_CLASSES: Record<SummaryCardProps['accent'], string> = {
  amber: 'bg-amber-50 border-amber-200 text-amber-900',
  blue: 'bg-blue-50 border-blue-200 text-blue-900',
  emerald: 'bg-emerald-50 border-emerald-200 text-emerald-900',
};

function SummaryCard({ label, count, accent }: SummaryCardProps) {
  return (
    <div className={`rounded-xl border p-4 ${ACCENT_CLASSES[accent]}`}>
      <p className="text-xs uppercase tracking-wider opacity-80">{label}</p>
      <p className="text-3xl font-bold mt-1">{count}</p>
    </div>
  );
}
