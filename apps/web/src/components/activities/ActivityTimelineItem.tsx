import { useState } from 'react';
import type { Activity } from '@horus/shared';

interface ActivityTimelineItemProps {
  activity: Activity;
  onToggle: (activityId: string, completed: boolean, notes?: string) => void;
  isToggling?: boolean;
}

function formatTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function ActivityTimelineItem({
  activity,
  onToggle,
  isToggling,
}: ActivityTimelineItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState(activity.record?.notes ?? '');

  const completed = activity.record?.completed ?? false;
  const isMonthlyFull =
    activity.periodicity === 'MONTHLY' &&
    activity.timesPerMonth != null &&
    (activity.monthlyCompletions ?? 0) >= activity.timesPerMonth;

  const handleCheck = () => {
    onToggle(activity.id, !completed, notes || undefined);
  };

  const handleSaveNotes = () => {
    onToggle(activity.id, completed, notes || undefined);
  };

  return (
    <div
      className={`glass-card overflow-hidden ${isMonthlyFull && !completed ? 'opacity-60' : ''}`}
    >
      <div className="flex items-center gap-3 p-3">
        {/* Checkbox circular */}
        <button
          onClick={handleCheck}
          disabled={isToggling}
          className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
            completed
              ? 'bg-indigo-600 border-indigo-600 text-white'
              : 'border-gray-300 hover:border-indigo-400'
          }`}
        >
          {completed && (
            <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
              <path
                d="M2 6l3 3 5-5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>

        {/* Emoji + Nombre */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex-1 flex items-center gap-2 text-left min-w-0"
        >
          {activity.emoji && (
            <span className="text-lg leading-none flex-shrink-0">{activity.emoji}</span>
          )}
          <span
            className={`text-sm font-medium truncate ${
              completed ? 'line-through text-gray-400' : 'text-gray-900'
            }`}
          >
            {activity.name}
          </span>
        </button>

        {/* Badges */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Contador mensual */}
          {activity.periodicity === 'MONTHLY' && activity.timesPerMonth != null && (
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                isMonthlyFull ? 'bg-gray-100 text-gray-500' : 'bg-indigo-50 text-indigo-700'
              }`}
            >
              {activity.monthlyCompletions ?? 0}/{activity.timesPerMonth}
            </span>
          )}

          {/* Duración */}
          {activity.durationMinutes && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
              {activity.durationMinutes} min
            </span>
          )}

          {/* Hora fija */}
          {activity.timeMode === 'FIXED' &&
            activity.fixedHour != null &&
            activity.fixedMinute != null && (
              <span className="text-xs text-gray-400 font-mono">
                {formatTime(activity.fixedHour, activity.fixedMinute)}
              </span>
            )}

          {/* Después de */}
          {activity.timeMode === 'AFTER_ACTIVITY' && activity.afterActivity && (
            <span className="text-xs text-gray-400 truncate max-w-[90px]">
              ↳ {activity.afterActivity.name}
            </span>
          )}

          {/* Chevron */}
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Contenido expandido */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100 space-y-3 pt-3">
          {activity.description && (
            <p className="text-sm text-gray-600 italic">{activity.description}</p>
          )}
          {activity.content && (
            <div
              className="text-sm text-gray-700 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: activity.content }}
            />
          )}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Notas del día</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              placeholder="¿Cómo fue? (opcional)"
            />
            <button
              onClick={handleSaveNotes}
              disabled={isToggling}
              className="mt-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Guardar notas
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
