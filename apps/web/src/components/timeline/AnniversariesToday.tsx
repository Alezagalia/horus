/**
 * Anniversaries Today — featured section at top of TimelinePage
 * F-16 - Arqueología Personal
 * Sprint 16 - US-153
 */

import type { TimelineEvent } from '@horus/shared';

interface AnniversariesTodayProps {
  events: TimelineEvent[];
}

export function AnniversariesToday({ events }: AnniversariesTodayProps) {
  if (events.length === 0) return null;

  return (
    <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-rose-50 border border-amber-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-rose-500 flex items-center justify-center text-2xl">
          🎂
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Aniversarios de hoy</h2>
          <p className="text-sm text-gray-600">Hitos que se cumplen en esta fecha</p>
        </div>
      </div>
      <ul className="space-y-2">
        {events.map((event) => (
          <li key={event.id} className="rounded-lg bg-white/70 backdrop-blur px-4 py-3">
            <p className="font-medium text-gray-900">{event.title}</p>
            {event.description && (
              <p className="text-xs text-gray-600 mt-0.5">{event.description}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
