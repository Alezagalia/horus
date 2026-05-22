/**
 * Timeline Event Card
 * F-16 - Arqueología Personal
 * Sprint 16 - US-153
 */

import { useNavigate } from 'react-router-dom';
import type { TimelineEvent, TimelineEventCategory, TimelineModule } from '@horus/shared';

interface TimelineEventCardProps {
  event: TimelineEvent;
}

const MODULE_ICONS: Record<TimelineModule, string> = {
  habits: '🎯',
  tasks: '✅',
  workouts: '💪',
  goals: '🏆',
  finance: '💸',
  resources: '📚',
};

const CATEGORY_BORDER: Record<TimelineEventCategory, string> = {
  first: 'border-l-indigo-500',
  completed: 'border-l-emerald-500',
  anniversary: 'border-l-amber-500',
  milestone: 'border-l-violet-500',
};

const CATEGORY_LABEL: Record<TimelineEventCategory, string> = {
  first: 'Primera vez',
  completed: 'Hito',
  anniversary: 'Aniversario',
  milestone: 'Marca',
};

const MODULE_LABEL: Record<TimelineModule, string> = {
  habits: 'Hábitos',
  tasks: 'Tareas',
  workouts: 'Workouts',
  goals: 'Metas',
  finance: 'Finanzas',
  resources: 'Recursos',
};

function entityHref(event: TimelineEvent): string | null {
  if (!event.entity) return null;
  switch (event.entity.type) {
    case 'habits':
      return `/habits/${event.entity.id}/stats`;
    case 'goals':
      return `/goals/${event.entity.id}`;
    case 'workouts':
      return `/workouts/${event.entity.id}`;
    case 'finance':
      // Accounts have a detail page; transactions don't.
      return event.kind === 'account.created' ? `/accounts/${event.entity.id}` : null;
    case 'resources':
    case 'tasks':
    default:
      return null;
  }
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

export function TimelineEventCard({ event }: TimelineEventCardProps) {
  const navigate = useNavigate();
  const href = entityHref(event);
  const clickable = href !== null;

  const handleClick = () => {
    if (href) navigate(href);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!clickable}
      className={`w-full text-left rounded-xl border border-gray-100 border-l-4 bg-white p-5 shadow-sm transition-shadow ${
        CATEGORY_BORDER[event.category]
      } ${clickable ? 'hover:shadow-md cursor-pointer' : 'cursor-default'}`}
    >
      <div className="flex items-start gap-4">
        <div className="text-3xl flex-shrink-0">{MODULE_ICONS[event.module]}</div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900">{event.title}</h3>
          {event.description && <p className="text-sm text-gray-600 mt-1">{event.description}</p>}
          <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-gray-500">
            <span>{formatDate(event.date)}</span>
            <span aria-hidden>·</span>
            <span className="px-2 py-0.5 rounded-full bg-gray-100">
              {CATEGORY_LABEL[event.category]}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-gray-100">
              {MODULE_LABEL[event.module]}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
