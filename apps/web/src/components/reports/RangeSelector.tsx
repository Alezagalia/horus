/**
 * Reports Range Selector
 * F-07 - Reportes y Tendencias
 * Sprint 15 - US-147
 */

import type { RangePresetId } from '@/hooks/useAnalyticsRange';

interface RangeSelectorProps {
  preset: RangePresetId;
  from: string;
  to: string;
  onPreset: (preset: RangePresetId) => void;
  onCustom: (from: string, to: string) => void;
}

const PRESETS: { id: Exclude<RangePresetId, 'custom'>; label: string }[] = [
  { id: '7d', label: '7 días' },
  { id: '30d', label: '30 días' },
  { id: '90d', label: '90 días' },
  { id: 'thisMonth', label: 'Este mes' },
  { id: 'thisYear', label: 'Este año' },
];

export function RangeSelector({ preset, from, to, onPreset, onCustom }: RangeSelectorProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex flex-wrap gap-1 rounded-xl bg-gray-100 p-1">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onPreset(p.id)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              preset === p.id
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-2 py-1">
        <input
          type="date"
          value={from}
          max={to}
          onChange={(e) => onCustom(e.target.value, to)}
          className="border-0 bg-transparent text-sm focus:outline-none"
        />
        <span className="text-gray-400">→</span>
        <input
          type="date"
          value={to}
          min={from}
          onChange={(e) => onCustom(from, e.target.value)}
          className="border-0 bg-transparent text-sm focus:outline-none"
        />
      </div>
    </div>
  );
}
