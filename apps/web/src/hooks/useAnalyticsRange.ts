/**
 * Analytics Range State (in-page shared range)
 * F-07 - Reportes y Tendencias
 * Sprint 15 - US-147
 */

import { useCallback, useMemo, useState } from 'react';

export type RangePresetId = '7d' | '30d' | '90d' | 'thisMonth' | 'thisYear' | 'custom';

export interface AnalyticsRange {
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
  presetId: RangePresetId;
}

function toISODate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function todayUTC(): Date {
  const n = new Date();
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()));
}

export function rangeForPreset(preset: RangePresetId): { from: string; to: string } {
  const today = todayUTC();
  const to = toISODate(today);

  switch (preset) {
    case '7d': {
      const from = new Date(today);
      from.setUTCDate(from.getUTCDate() - 6);
      return { from: toISODate(from), to };
    }
    case '30d': {
      const from = new Date(today);
      from.setUTCDate(from.getUTCDate() - 29);
      return { from: toISODate(from), to };
    }
    case '90d': {
      const from = new Date(today);
      from.setUTCDate(from.getUTCDate() - 89);
      return { from: toISODate(from), to };
    }
    case 'thisMonth': {
      const from = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
      return { from: toISODate(from), to };
    }
    case 'thisYear': {
      const from = new Date(Date.UTC(today.getUTCFullYear(), 0, 1));
      return { from: toISODate(from), to };
    }
    case 'custom':
    default:
      return { from: toISODate(today), to };
  }
}

export function useAnalyticsRange(initial: RangePresetId = '30d') {
  const initialRange = useMemo(() => {
    const { from, to } = rangeForPreset(initial);
    return { from, to, presetId: initial };
  }, [initial]);

  const [range, setRange] = useState<AnalyticsRange>(initialRange);

  const selectPreset = useCallback((preset: RangePresetId) => {
    if (preset === 'custom') {
      setRange((r) => ({ ...r, presetId: 'custom' }));
      return;
    }
    const { from, to } = rangeForPreset(preset);
    setRange({ from, to, presetId: preset });
  }, []);

  const setCustomRange = useCallback((from: string, to: string) => {
    setRange({ from, to, presetId: 'custom' });
  }, []);

  return {
    range,
    selectPreset,
    setCustomRange,
  };
}
