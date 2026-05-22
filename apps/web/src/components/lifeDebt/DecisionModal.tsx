/**
 * Life Debt - Decision Modal
 * F-14 - Deuda de Vida
 * Sprint 17
 *
 * Modal forzado al entrar a /life-debt: presenta cada ítem y obliga al usuario
 * a decidir entre Comprometer / Delegar / Eliminar (o cerrarlo manualmente).
 */

import { useEffect, useState } from 'react';
import type { LifeDebtDecisionKind, LifeDebtItem } from '@horus/shared';

interface DecisionModalProps {
  item: LifeDebtItem;
  index: number;
  total: number;
  onSubmit: (input: {
    decision: LifeDebtDecisionKind;
    commitDate?: string;
    reason?: string;
  }) => Promise<void>;
  onClose: () => void;
  isSubmitting: boolean;
}

function todayPlusDays(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function DecisionModal({
  item,
  index,
  total,
  onSubmit,
  onClose,
  isSubmitting,
}: DecisionModalProps) {
  const [step, setStep] = useState<'choose' | 'commit' | 'delete-confirm'>('choose');
  const [commitDate, setCommitDate] = useState<string>(todayPlusDays(7));
  const [reason, setReason] = useState<string>('');
  const tomorrow = todayPlusDays(1);

  // Reset when item changes.
  useEffect(() => {
    setStep('choose');
    setCommitDate(todayPlusDays(7));
    setReason('');
  }, [item.id]);

  const handleCommit = async () => {
    await onSubmit({ decision: 'commit', commitDate, reason: reason || undefined });
  };
  const handleDelegate = async () => {
    await onSubmit({ decision: 'delegate', reason: reason || undefined });
  };
  const handleDelete = async () => {
    await onSubmit({ decision: 'delete', reason: reason || undefined });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-rose-500 to-orange-500 px-6 py-4 text-white">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider opacity-90">
              Deuda {index + 1} de {total}
            </span>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-white/80 hover:text-white text-sm"
            >
              Cerrar
            </button>
          </div>
          <h2 className="text-lg font-bold">{item.title}</h2>
          <p className="text-sm opacity-90 mt-0.5">{item.reason}</p>
        </div>

        <div className="p-6 space-y-4">
          {step === 'choose' && (
            <>
              <p className="text-sm text-gray-600">
                ¿Qué querés hacer con este ítem? Sin zona gris.
              </p>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => setStep('commit')}
                  className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 text-left hover:bg-indigo-50 hover:border-indigo-300"
                >
                  <span className="text-2xl">📅</span>
                  <div>
                    <p className="font-semibold text-gray-900">Comprometer una fecha</p>
                    <p className="text-xs text-gray-500">Vas a hacerlo. Definí cuándo.</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={handleDelegate}
                  disabled={isSubmitting}
                  className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 text-left hover:bg-amber-50 hover:border-amber-300 disabled:opacity-50"
                >
                  <span className="text-2xl">🤝</span>
                  <div>
                    <p className="font-semibold text-gray-900">Delegar</p>
                    <p className="text-xs text-gray-500">
                      No es tu responsabilidad directa. Lo dejás afuera de tu deuda.
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setStep('delete-confirm')}
                  className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 text-left hover:bg-red-50 hover:border-red-300"
                >
                  <span className="text-2xl">🗑️</span>
                  <div>
                    <p className="font-semibold text-gray-900">Eliminar</p>
                    <p className="text-xs text-gray-500">Ya no querés hacerlo. Soltalo.</p>
                  </div>
                </button>
              </div>
            </>
          )}

          {step === 'commit' && (
            <>
              <p className="text-sm text-gray-600">
                Comprometete con una fecha concreta. Es un pacto con vos mismo.
              </p>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Nueva fecha</label>
                <input
                  type="date"
                  value={commitDate}
                  min={tomorrow}
                  onChange={(e) => setCommitDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Nota (opcional)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  placeholder="¿Por qué ahora sí?"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('choose')}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200"
                >
                  Atrás
                </button>
                <button
                  type="button"
                  onClick={handleCommit}
                  disabled={isSubmitting || !commitDate}
                  className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Guardando…' : 'Comprometer'}
                </button>
              </div>
            </>
          )}

          {step === 'delete-confirm' && (
            <>
              <p className="text-sm text-gray-600">
                Vas a archivar <strong>{item.title}</strong>. No podrás recuperarlo desde acá.
              </p>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Nota (opcional)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  placeholder="¿Por qué soltarlo ahora?"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('choose')}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200"
                >
                  Atrás
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Eliminando…' : 'Eliminar'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
