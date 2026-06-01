/**
 * DailyTimeline — Agenda cronológica del día
 * Unifica hábitos, actividades y eventos en un único timeline ordenado por hora.
 */

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

// ─── Tipos de entrada ────────────────────────────────────────────────────────

interface HabitEntry {
  id: string;
  name: string;
  completed: boolean;
  categoryIcon: string;
  currentStreak: number;
  timeOfDay: string;
}

interface ActivityEntry {
  id: string;
  name: string;
  emoji?: string | null;
  durationMinutes?: number | null;
  timeMode: string;
  fixedHour?: number | null;
  fixedMinute?: number | null;
  afterActivityId?: string | null;
  afterActivity?: { id: string; name: string } | null;
  record?: { completed: boolean } | null;
}

interface EventEntry {
  id: string;
  title: string;
  startDateTime: string;
  endDateTime: string;
  isAllDay: boolean;
  location?: string | null;
  category?: { icon?: string | null } | null;
}

interface HabitMomentEntry {
  key: string;
  startHour: number;
  startMinute: number;
  label: string;
  emoji: string;
}

interface DailyTimelineProps {
  habits: HabitEntry[];
  activities: ActivityEntry[];
  events: EventEntry[];
  habitMoments: HabitMomentEntry[];
  onToggleHabit: (id: string, completed: boolean) => void;
  onToggleActivity: (id: string, completed: boolean) => void;
  isToggling: boolean;
}

// ─── Tipos internos ───────────────────────────────────────────────────────────

type ItemType = 'habit' | 'activity' | 'event';

interface UnifiedItem {
  key: string;
  type: ItemType;
  id: string;
  title: string;
  completed: boolean;
  toggleable: boolean;
  /** emoji o icon del item */
  icon: string;
  streak?: number;
  /** duración en minutos (actividades) */
  duration?: number;
  /** nombre de la actividad previa para AFTER_ACTIVITY */
  afterLabel?: string;
  /** hora de fin formateada "HH:MM" (eventos) */
  eventEndTime?: string;
  location?: string | null;
  isAllDay: boolean;
}

interface TimeSlot {
  timeLabel: string;
  /** minutos desde medianoche para ordenar; -1 = todo el día; Infinity = sin hora */
  sortValue: number;
  items: UnifiedItem[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function toTimeLabel(hour: number, minute: number) {
  return `${pad(hour)}:${pad(minute)}`;
}

/** Resuelve la hora de una actividad.
 *  Para AFTER_ACTIVITY intenta sumar la duración del padre (hasta 5 niveles). */
function resolveActivityTime(
  act: ActivityEntry,
  allActivities: ActivityEntry[],
  depth = 0
): { hour: number | null; minute: number } {
  if (depth > 5) return { hour: null, minute: 0 };

  if (act.timeMode === 'FIXED' && act.fixedHour != null) {
    return { hour: act.fixedHour, minute: act.fixedMinute ?? 0 };
  }

  if (act.timeMode === 'AFTER_ACTIVITY' && act.afterActivityId) {
    const parent = allActivities.find((a) => a.id === act.afterActivityId);
    if (parent) {
      const pt = resolveActivityTime(parent, allActivities, depth + 1);
      if (pt.hour !== null) {
        const total = pt.hour * 60 + pt.minute + (parent.durationMinutes ?? 0);
        return { hour: Math.floor(total / 60) % 24, minute: total % 60 };
      }
    }
  }

  return { hour: null, minute: 0 };
}

// ─── Subcomponente: fila de ítem ──────────────────────────────────────────────

function ItemRow({
  item,
  onToggleHabit,
  onToggleActivity,
  isToggling,
}: {
  item: UnifiedItem;
  onToggleHabit: (id: string, completed: boolean) => void;
  onToggleActivity: (id: string, completed: boolean) => void;
  isToggling: boolean;
}) {
  const handleToggle = () => {
    if (!item.toggleable || isToggling) return;
    if (item.type === 'habit') onToggleHabit(item.id, !item.completed);
    if (item.type === 'activity') onToggleActivity(item.id, !item.completed);
  };

  const isEvent = item.type === 'event';

  return (
    <div
      className={`flex items-center gap-3 py-2 px-1 rounded-lg transition-colors ${
        isEvent ? 'bg-purple-50' : item.completed ? 'bg-green-50' : 'hover:bg-gray-50'
      }`}
    >
      {/* Ícono / tipo */}
      <div
        className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-sm ${
          isEvent
            ? 'bg-purple-100 text-purple-700'
            : item.type === 'activity'
              ? 'bg-indigo-100 text-indigo-700'
              : 'bg-gray-100 text-gray-700'
        }`}
      >
        {item.icon}
      </div>

      {/* Contenido */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium truncate ${
            item.completed ? 'line-through text-gray-400' : 'text-gray-800'
          }`}
        >
          {item.title}
        </p>

        {/* Subinfo */}
        <div className="flex items-center gap-2 flex-wrap mt-0.5">
          {item.afterLabel && <span className="text-xs text-gray-400">↳ {item.afterLabel}</span>}
          {item.duration && <span className="text-xs text-gray-400">{item.duration} min</span>}
          {item.eventEndTime && (
            <span className="text-xs text-purple-500 font-medium">hasta {item.eventEndTime}</span>
          )}
          {item.location && (
            <span className="text-xs text-gray-400 truncate max-w-[120px]">📍 {item.location}</span>
          )}
          {item.streak != null && item.streak > 0 && (
            <span className="text-xs text-orange-500 font-medium">🔥 {item.streak}</span>
          )}
        </div>
      </div>

      {/* Toggle (solo hábitos y actividades) */}
      {item.toggleable && (
        <button
          onClick={handleToggle}
          disabled={isToggling}
          className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
            item.completed
              ? 'bg-green-500 border-green-500 text-white scale-100'
              : 'border-gray-300 bg-white hover:border-indigo-400 hover:scale-105'
          } ${isToggling ? 'opacity-60 cursor-wait' : 'cursor-pointer'}`}
          aria-label={item.completed ? 'Desmarcar' : 'Completar'}
        >
          {item.completed && (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </button>
      )}

      {/* Badge de tipo (solo eventos) */}
      {isEvent && (
        <span className="text-xs px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-medium flex-shrink-0">
          Evento
        </span>
      )}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function DailyTimeline({
  habits,
  activities,
  events,
  habitMoments,
  onToggleHabit,
  onToggleActivity,
  isToggling,
}: DailyTimelineProps) {
  const navigate = useNavigate();

  const momentMap = useMemo(() => new Map(habitMoments.map((m) => [m.key, m])), [habitMoments]);

  const slots = useMemo<TimeSlot[]>(() => {
    const slotMap = new Map<string, TimeSlot>();

    const getOrCreate = (key: string, label: string, sortValue: number): TimeSlot => {
      if (!slotMap.has(key)) {
        slotMap.set(key, { timeLabel: label, sortValue, items: [] });
      }
      return slotMap.get(key)!;
    };

    // ── Hábitos ──────────────────────────────────────────────────────────────
    habits.forEach((habit) => {
      const moment = momentMap.get(habit.timeOfDay);
      let slotKey: string, label: string, sortValue: number;

      if (moment) {
        label = toTimeLabel(moment.startHour, moment.startMinute);
        slotKey = label;
        sortValue = moment.startHour * 60 + moment.startMinute;
      } else {
        slotKey = 'notime';
        label = 'Sin hora';
        sortValue = Infinity;
      }

      getOrCreate(slotKey, label, sortValue).items.push({
        key: `habit-${habit.id}`,
        type: 'habit',
        id: habit.id,
        title: habit.name,
        completed: habit.completed,
        toggleable: true,
        icon: habit.categoryIcon,
        streak: habit.currentStreak > 0 ? habit.currentStreak : undefined,
        isAllDay: false,
      });
    });

    // ── Actividades ───────────────────────────────────────────────────────────
    const resolvedTimes = new Map<string, { hour: number | null; minute: number }>();
    activities.forEach((act) => {
      resolvedTimes.set(act.id, resolveActivityTime(act, activities));
    });

    activities.forEach((act) => {
      const { hour, minute } = resolvedTimes.get(act.id) ?? { hour: null, minute: 0 };
      let slotKey: string, label: string, sortValue: number;

      if (hour !== null) {
        label = toTimeLabel(hour, minute);
        slotKey = label;
        sortValue = hour * 60 + minute;
      } else {
        slotKey = 'notime';
        label = 'Sin hora';
        sortValue = Infinity;
      }

      getOrCreate(slotKey, label, sortValue).items.push({
        key: `activity-${act.id}`,
        type: 'activity',
        id: act.id,
        title: act.name,
        completed: act.record?.completed ?? false,
        toggleable: true,
        icon: act.emoji ?? '⚡',
        duration: act.durationMinutes ?? undefined,
        afterLabel: act.afterActivity?.name,
        isAllDay: false,
      });
    });

    // ── Eventos ───────────────────────────────────────────────────────────────
    events.forEach((event) => {
      if (event.isAllDay) {
        getOrCreate('allday', 'Todo el día', -1).items.push({
          key: `event-${event.id}`,
          type: 'event',
          id: event.id,
          title: event.title,
          completed: false,
          toggleable: false,
          icon: event.category?.icon ?? '📅',
          location: event.location,
          isAllDay: true,
        });
      } else {
        const start = new Date(event.startDateTime);
        const end = new Date(event.endDateTime);
        const h = start.getHours();
        const m = start.getMinutes();
        const label = toTimeLabel(h, m);
        getOrCreate(label, label, h * 60 + m).items.push({
          key: `event-${event.id}`,
          type: 'event',
          id: event.id,
          title: event.title,
          completed: false,
          toggleable: false,
          icon: event.category?.icon ?? '📅',
          eventEndTime: toTimeLabel(end.getHours(), end.getMinutes()),
          location: event.location,
          isAllDay: false,
        });
      }
    });

    // Ordenar slots: allday → timed (asc) → notime
    return Array.from(slotMap.values()).sort((a, b) => {
      if (a.sortValue === -1) return -1;
      if (b.sortValue === -1) return 1;
      if (a.sortValue === Infinity) return 1;
      if (b.sortValue === Infinity) return -1;
      return a.sortValue - b.sortValue;
    });
  }, [habits, activities, events, momentMap]);

  const isEmpty = slots.length === 0;
  const completedCount = slots
    .flatMap((s) => s.items)
    .filter((i) => i.toggleable && i.completed).length;
  const toggleableCount = slots.flatMap((s) => s.items).filter((i) => i.toggleable).length;

  return (
    <div
      className="glass-card p-6 animate-slide-up opacity-0 delay-300"
      style={{ animationFillMode: 'forwards' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Agenda del día</h2>
          <p className="text-sm text-gray-500">
            {toggleableCount > 0
              ? `${completedCount}/${toggleableCount} completados`
              : 'Hábitos · Actividades · Eventos'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/habits/today')}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            🔄 Hábitos
          </button>
          <span className="text-gray-300">·</span>
          <button
            onClick={() => navigate('/activities')}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            ⚡ Actividades
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

      {/* Leyenda de tipos */}
      <div className="flex items-center gap-3 mb-4 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-gray-400 inline-block" /> Hábito
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-indigo-400 inline-block" /> Actividad
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-purple-400 inline-block" /> Evento
        </span>
      </div>

      {/* Contenido */}
      {isEmpty ? (
        <div className="text-center py-10">
          <div className="text-4xl mb-3 opacity-40">📆</div>
          <p className="text-gray-500 font-medium">Día sin agenda</p>
          <p className="text-sm text-gray-400 mt-1">
            No hay hábitos, actividades ni eventos para hoy
          </p>
          <div className="flex justify-center gap-3 mt-4">
            <button
              onClick={() => navigate('/habits/today')}
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              🔄 Hábitos
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={() => navigate('/activities')}
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              ⚡ Actividades
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={() => navigate('/calendar')}
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              📅 Calendario
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4 max-h-[480px] overflow-y-auto custom-scrollbar pr-1">
          {slots.map((slot) => (
            <div key={slot.timeLabel}>
              {/* Separador horario */}
              <div className="flex items-center gap-2 mb-1.5">
                <span
                  className={`text-xs font-semibold font-mono ${
                    slot.sortValue === -1
                      ? 'text-purple-600'
                      : slot.sortValue === Infinity
                        ? 'text-gray-400'
                        : 'text-indigo-600'
                  }`}
                >
                  {slot.timeLabel}
                </span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              {/* Ítems del slot */}
              <div className="space-y-0.5 pl-1">
                {slot.items.map((item) => (
                  <ItemRow
                    key={item.key}
                    item={item}
                    onToggleHabit={onToggleHabit}
                    onToggleActivity={onToggleActivity}
                    isToggling={isToggling}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
