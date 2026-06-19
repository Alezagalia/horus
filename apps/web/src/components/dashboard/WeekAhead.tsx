/**
 * WeekAhead — Resumen de la semana
 * Combina tareas con vencimiento y eventos de los próximos 7 días,
 * agrupados por día y ordenados cronológicamente.
 */

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, isToday, isTomorrow, startOfDay, endOfDay, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Task, TaskPriority } from '@/types/tasks';
import type { CalendarEvent } from '@horus/shared';

interface WeekAheadProps {
  tasks: Task[];
  events: CalendarEvent[];
}

type UpcomingType = 'task' | 'event';

interface UpcomingItem {
  key: string;
  type: UpcomingType;
  id: string;
  title: string;
  /** Fecha usada para ordenar y agrupar */
  date: Date;
  icon: string;
  /** "HH:MM" para eventos con hora */
  timeLabel?: string;
  priority?: TaskPriority;
  location?: string | null;
}

interface DayGroup {
  key: string;
  label: string;
  items: UpcomingItem[];
}

const MAX_ITEMS = 8;

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  alta: 'bg-red-100 text-red-700',
  media: 'bg-amber-100 text-amber-700',
  baja: 'bg-green-100 text-green-700',
};

function pad(n: number) {
  return String(n).padStart(2, '0');
}

/**
 * Devuelve el icono solo si es un emoji válido. Algunos datos antiguos guardan
 * el icono como nombre de componente lucide (p. ej. "Briefcase"), que no se
 * renderiza como icono; en ese caso (o si está vacío) usa el fallback.
 */
function resolveEmojiIcon(icon: string | null | undefined, fallback: string): string {
  const value = icon?.trim();
  if (!value) return fallback;
  return /^[A-Za-z]/.test(value) ? fallback : value;
}

/** Etiqueta del día: "Hoy", "Mañana" o "lun 3 jun". */
function dayLabel(date: Date): string {
  if (isToday(date)) return 'Hoy';
  if (isTomorrow(date)) return 'Mañana';
  return format(date, "EEE d 'de' MMM", { locale: es });
}

export function WeekAhead({ tasks, events }: WeekAheadProps) {
  const navigate = useNavigate();

  const { groups, hiddenCount } = useMemo(() => {
    const windowStart = startOfDay(new Date());
    const windowEnd = endOfDay(addDays(new Date(), 7));
    const inWindow = (d: Date) => d >= windowStart && d <= windowEnd;

    const items: UpcomingItem[] = [];

    // ── Tareas con vencimiento (no completadas) ──────────────────────────────
    tasks.forEach((task) => {
      if (task.status === 'completed' || !task.dueDate) return;
      const date = new Date(task.dueDate);
      if (Number.isNaN(date.getTime()) || !inWindow(date)) return;

      items.push({
        key: `task-${task.id}`,
        type: 'task',
        id: task.id,
        title: task.title,
        date,
        icon: resolveEmojiIcon(task.categoryIcon, '✅'),
        priority: task.priority,
      });
    });

    // ── Eventos (no cancelados) ───────────────────────────────────────────────
    events.forEach((event) => {
      if (event.status === 'cancelado') return;
      const date = new Date(event.startDateTime);
      if (Number.isNaN(date.getTime()) || !inWindow(date)) return;

      items.push({
        key: `event-${event.id}`,
        type: 'event',
        id: event.id,
        title: event.title,
        date,
        icon: resolveEmojiIcon(event.category?.icon, '📅'),
        timeLabel: event.isAllDay ? undefined : `${pad(date.getHours())}:${pad(date.getMinutes())}`,
        location: event.location,
      });
    });

    // Orden cronológico y recorte
    items.sort((a, b) => a.date.getTime() - b.date.getTime());
    const visible = items.slice(0, MAX_ITEMS);

    // Agrupar por día preservando el orden
    const map = new Map<string, DayGroup>();
    visible.forEach((item) => {
      const key = format(item.date, 'yyyy-MM-dd');
      if (!map.has(key)) {
        map.set(key, { key, label: dayLabel(item.date), items: [] });
      }
      map.get(key)!.items.push(item);
    });

    return { groups: Array.from(map.values()), hiddenCount: items.length - visible.length };
  }, [tasks, events]);

  const isEmpty = groups.length === 0;

  return (
    <div
      className="glass-card p-6 animate-slide-up opacity-0 delay-500"
      style={{ animationFillMode: 'forwards' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Esta semana</h2>
          <p className="text-sm text-gray-500">Próximas tareas y eventos (7 días)</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/tasks')}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            ✅ Tareas
          </button>
          <span className="text-gray-300">·</span>
          <button
            onClick={() => navigate('/calendar')}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            📅 Calendario
          </button>
        </div>
      </div>

      {/* Contenido */}
      {isEmpty ? (
        <div className="text-center py-10">
          <div className="text-4xl mb-3 opacity-40">🗓️</div>
          <p className="text-gray-500 font-medium">Semana despejada</p>
          <p className="text-sm text-gray-400 mt-1">
            No hay tareas ni eventos en los próximos 7 días
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <div key={group.key}>
              {/* Separador de día */}
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-semibold text-indigo-600 capitalize">
                  {group.label}
                </span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              {/* Ítems del día */}
              <div className="space-y-0.5 pl-1">
                {group.items.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => navigate(item.type === 'task' ? '/tasks' : '/calendar')}
                    className="w-full flex items-center gap-3 py-2 px-1 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    {/* Ícono / tipo */}
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-sm ${
                        item.type === 'event'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {item.icon}
                    </div>

                    {/* Contenido */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{item.title}</p>
                      <div className="flex items-center gap-2 flex-wrap mt-0.5">
                        {item.timeLabel && (
                          <span className="text-xs text-purple-500 font-medium">
                            {item.timeLabel}
                          </span>
                        )}
                        {item.location && (
                          <span className="text-xs text-gray-400 truncate max-w-[140px]">
                            📍 {item.location}
                          </span>
                        )}
                        {item.priority && (
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded font-medium ${PRIORITY_STYLES[item.priority]}`}
                          >
                            {item.priority}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Badge de tipo */}
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${
                        item.type === 'event'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {item.type === 'event' ? 'Evento' : 'Tarea'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}

          {hiddenCount > 0 && (
            <button
              onClick={() => navigate('/calendar')}
              className="w-full text-center text-sm text-gray-500 hover:text-gray-700 py-1"
            >
              +{hiddenCount} más esta semana...
            </button>
          )}
        </div>
      )}
    </div>
  );
}
