/**
 * Insight Card
 * F-12 - Motor de Correlaciones Personales
 * Sprint 18
 */

import { useEffect, useRef } from 'react';
import type { Insight, InsightSeverity } from '@horus/shared';

interface InsightCardProps {
  insight: Insight;
  onDismiss: (id: string) => void;
  onMarkSeen: (id: string) => void;
}

const SEVERITY_STYLES: Record<
  InsightSeverity,
  { border: string; bg: string; icon: string; iconBg: string }
> = {
  positive: {
    border: 'border-emerald-200',
    bg: 'bg-emerald-50',
    icon: '✨',
    iconBg: 'from-emerald-500 to-green-500',
  },
  neutral: {
    border: 'border-indigo-200',
    bg: 'bg-indigo-50',
    icon: '🔍',
    iconBg: 'from-indigo-500 to-violet-500',
  },
  negative: {
    border: 'border-rose-200',
    bg: 'bg-rose-50',
    icon: '⚡',
    iconBg: 'from-rose-500 to-red-500',
  },
};

function formatDetectedAt(iso: string): string {
  const dt = new Date(iso);
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(dt);
}

export function InsightCard({ insight, onDismiss, onMarkSeen }: InsightCardProps) {
  const style = SEVERITY_STYLES[insight.severity];
  const isNew = insight.seenAt === null;
  const markedSeenRef = useRef(false);

  useEffect(() => {
    if (!markedSeenRef.current && isNew) {
      markedSeenRef.current = true;
      onMarkSeen(insight.id);
    }
  }, [insight.id, isNew, onMarkSeen]);

  return (
    <article
      className={`rounded-2xl border-2 ${style.border} ${style.bg} p-5 shadow-sm transition-all hover:shadow-md`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${style.iconBg} flex items-center justify-center text-2xl flex-shrink-0`}
        >
          {style.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {isNew && (
              <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider">
                Nuevo
              </span>
            )}
            <span className="text-xs text-gray-500">{formatDetectedAt(insight.detectedAt)}</span>
          </div>
          <h3 className="font-bold text-gray-900 text-lg leading-tight">{insight.title}</h3>
          <p className="text-sm text-gray-700 mt-2 leading-relaxed">{insight.description}</p>
        </div>
        <button
          type="button"
          onClick={() => onDismiss(insight.id)}
          className="text-gray-400 hover:text-gray-700 text-sm flex-shrink-0"
          aria-label="Descartar"
          title="Descartar (oculto 30 días)"
        >
          ✕
        </button>
      </div>
    </article>
  );
}
