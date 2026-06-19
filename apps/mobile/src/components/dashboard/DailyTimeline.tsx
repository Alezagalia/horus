/**
 * DailyTimeline — Agenda cronológica del día
 * Unifica hábitos, actividades y eventos en un único timeline ordenado por hora.
 */

import { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { format } from 'date-fns';
import { Check } from 'lucide-react-native';
import { Colors, Spacing, Radius } from '@/tokens';
import type { Habit } from '@/services/api/habitApi';
import type { CalendarEvent } from '@/services/api/eventApi';
import type { HabitMoment } from '@/services/api/habitMomentApi';
import type { Activity } from '@horus/shared';
import { ActivityTimeMode } from '@horus/shared';

// ─── Internal types ───────────────────────────────────────────────────────────

type ItemType = 'habit' | 'activity' | 'event';

interface UnifiedItem {
  key: string;
  type: ItemType;
  id: string;
  title: string;
  completed: boolean;
  toggleable: boolean;
  icon: string;
  streak?: number;
  duration?: number;
  afterLabel?: string;
  eventEndTime?: string;
  location?: string | null;
  isAllDay: boolean;
}

interface TimeSlot {
  timeLabel: string;
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

function resolveActivityTime(
  act: Activity,
  allActivities: Activity[],
  depth = 0
): { hour: number | null; minute: number } {
  if (depth > 5) return { hour: null, minute: 0 };

  if (act.timeMode === ActivityTimeMode.FIXED && act.fixedHour != null) {
    return { hour: act.fixedHour, minute: act.fixedMinute ?? 0 };
  }

  if (act.timeMode === ActivityTimeMode.AFTER_ACTIVITY && act.afterActivityId) {
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

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  habits: Habit[];
  activities: Activity[];
  events: CalendarEvent[];
  habitMoments: HabitMoment[];
  onToggleHabit: (id: string) => void;
  onToggleActivity: (id: string) => void;
  togglingHabitId?: string;
  togglingActivityId?: string;
  /** Si se define, la lista de slots scrollea internamente con este alto máximo (como la web). */
  maxHeight?: number;
}

// ─── ItemRow ──────────────────────────────────────────────────────────────────

function ItemRow({
  item,
  onToggleHabit,
  onToggleActivity,
  togglingHabitId,
  togglingActivityId,
}: {
  item: UnifiedItem;
  onToggleHabit: (id: string) => void;
  onToggleActivity: (id: string) => void;
  togglingHabitId?: string;
  togglingActivityId?: string;
}) {
  const isToggling =
    (item.type === 'habit' && togglingHabitId === item.id) ||
    (item.type === 'activity' && togglingActivityId === item.id);

  const handleToggle = () => {
    if (!item.toggleable || isToggling) return;
    if (item.type === 'habit') onToggleHabit(item.id);
    if (item.type === 'activity') onToggleActivity(item.id);
  };

  const accentColor =
    item.type === 'event' ? Colors.ceilDark : item.type === 'activity' ? Colors.vivid : Colors.ink;

  return (
    <View style={styles.itemRow}>
      {/* Icon box */}
      <View style={[styles.iconBox, { backgroundColor: accentColor + '18' }]}>
        <Text style={styles.iconText}>{item.icon}</Text>
      </View>

      {/* Content */}
      <View style={styles.itemContent}>
        <Text style={[styles.itemTitle, item.completed && styles.itemTitleDone]} numberOfLines={1}>
          {item.title}
        </Text>
        {(item.afterLabel != null ||
          item.duration != null ||
          item.eventEndTime != null ||
          item.location != null ||
          (item.streak != null && item.streak > 0)) && (
          <View style={styles.itemMeta}>
            {item.afterLabel != null && <Text style={styles.metaText}>↳ {item.afterLabel}</Text>}
            {item.duration != null && <Text style={styles.metaText}>{item.duration} min</Text>}
            {item.eventEndTime != null && (
              <Text style={[styles.metaText, { color: Colors.ceilDark }]}>
                hasta {item.eventEndTime}
              </Text>
            )}
            {item.location != null && (
              <Text style={styles.metaText} numberOfLines={1}>
                📍 {item.location}
              </Text>
            )}
            {item.streak != null && item.streak > 0 && (
              <Text style={[styles.metaText, { color: '#F97316' }]}>🔥 {item.streak}</Text>
            )}
          </View>
        )}
      </View>

      {/* Toggle (hábitos y actividades) */}
      {item.toggleable &&
        (isToggling ? (
          <ActivityIndicator size="small" color={accentColor} />
        ) : (
          <TouchableOpacity
            style={[
              item.type === 'habit' ? styles.checkSquare : styles.checkCircle,
              item.completed && { backgroundColor: accentColor, borderColor: accentColor },
            ]}
            onPress={handleToggle}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {item.completed && <Check size={12} color="#fff" strokeWidth={2.8} />}
          </TouchableOpacity>
        ))}

      {/* Event badge */}
      {item.type === 'event' && (
        <View style={styles.eventBadge}>
          <Text style={styles.eventBadgeText}>Evento</Text>
        </View>
      )}
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function DailyTimeline({
  habits,
  activities,
  events,
  habitMoments,
  onToggleHabit,
  onToggleActivity,
  togglingHabitId,
  togglingActivityId,
  maxHeight,
}: Props) {
  const momentMap = useMemo(() => new Map(habitMoments.map((m) => [m.key, m])), [habitMoments]);

  const slots = useMemo<TimeSlot[]>(() => {
    // Calculado dentro del memo (no a nivel de módulo) para que no quede congelado
    // en el día en que se cargó el bundle al minimizar/restaurar la app.
    const TODAY = format(new Date(), 'yyyy-MM-dd');
    const slotMap = new Map<string, TimeSlot>();

    const getOrCreate = (key: string, label: string, sortValue: number): TimeSlot => {
      if (!slotMap.has(key)) slotMap.set(key, { timeLabel: label, sortValue, items: [] });
      return slotMap.get(key)!;
    };

    // ── Hábitos ───────────────────────────────────────────────────────────────
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
        completed: !!habit.lastCompletedDate && habit.lastCompletedDate.startsWith(TODAY),
        toggleable: true,
        icon: habit.category?.icon ?? '🔄',
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
        afterLabel: (act as any).afterActivity?.name,
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

    return Array.from(slotMap.values()).sort((a, b) => {
      if (a.sortValue === -1) return -1;
      if (b.sortValue === -1) return 1;
      if (a.sortValue === Infinity) return 1;
      if (b.sortValue === Infinity) return -1;
      return a.sortValue - b.sortValue;
    });
  }, [habits, activities, events, momentMap]);

  const completedCount = slots
    .flatMap((s) => s.items)
    .filter((i) => i.toggleable && i.completed).length;
  const toggleableCount = slots.flatMap((s) => s.items).filter((i) => i.toggleable).length;

  if (slots.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyEmoji}>📆</Text>
        <Text style={styles.emptyTitle}>Día sin agenda</Text>
        <Text style={styles.emptySubtitle}>No hay hábitos, actividades ni eventos para hoy</Text>
      </View>
    );
  }

  const slotsContent = slots.map((slot, si) => (
    <View key={slot.timeLabel} style={si > 0 && styles.slotGap}>
      {/* Time separator */}
      <View style={styles.timeSeparator}>
        <Text
          style={[
            styles.timeLabel,
            slot.sortValue === -1
              ? { color: Colors.ceilDark }
              : slot.sortValue === Infinity
                ? { color: Colors.muted }
                : { color: Colors.vivid },
          ]}
        >
          {slot.timeLabel}
        </Text>
        <View style={styles.timeLine} />
      </View>

      {/* Items */}
      {slot.items.map((item, ii) => (
        <View key={item.key} style={ii < slot.items.length - 1 ? styles.itemDivider : undefined}>
          <ItemRow
            item={item}
            onToggleHabit={onToggleHabit}
            onToggleActivity={onToggleActivity}
            togglingHabitId={togglingHabitId}
            togglingActivityId={togglingActivityId}
          />
        </View>
      ))}
    </View>
  ));

  return (
    <View>
      {/* Legend + counter */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.ink }]} />
          <Text style={styles.legendText}>Hábito</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.vivid }]} />
          <Text style={styles.legendText}>Actividad</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.ceilDark }]} />
          <Text style={styles.legendText}>Evento</Text>
        </View>
        {toggleableCount > 0 && (
          <Text style={styles.completedBadge}>
            {completedCount}/{toggleableCount} listos
          </Text>
        )}
      </View>

      {/* Time slots — con scroll interno si maxHeight está definido (como la web) */}
      {maxHeight ? (
        <ScrollView
          style={{ maxHeight }}
          nestedScrollEnabled
          showsVerticalScrollIndicator
          contentContainerStyle={styles.scrollContent}
        >
          {slotsContent}
        </ScrollView>
      ) : (
        slotsContent
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Legend
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: Colors.muted,
  },
  completedBadge: {
    marginLeft: 'auto',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: Colors.vivid,
  },

  // Slots
  scrollContent: {
    paddingBottom: Spacing.md,
  },
  slotGap: {
    marginTop: Spacing.lg,
  },
  timeSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    marginBottom: 6,
  },
  timeLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    letterSpacing: 0.3,
  },
  timeLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.line,
  },

  // Item divider
  itemDivider: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },

  // Item row
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 11,
    gap: Spacing.sm,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 16,
    lineHeight: 20,
  },
  itemContent: {
    flex: 1,
    minWidth: 0,
  },
  itemTitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: Colors.ink,
  },
  itemTitleDone: {
    color: Colors.muted,
    textDecorationLine: 'line-through',
  },
  itemMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  metaText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: Colors.muted,
  },

  // Habit checkbox (square)
  checkSquare: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: Colors.line,
    backgroundColor: Colors.ice,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Activity checkbox (circle)
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Event badge
  eventBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: Radius.xs,
    backgroundColor: Colors.ceilDark + '20',
  },
  eventBadgeText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
    color: Colors.ceilDark,
  },

  // Empty state
  empty: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
    paddingHorizontal: Spacing.lg,
  },
  emptyEmoji: {
    fontSize: 32,
    marginBottom: Spacing.sm,
    opacity: 0.4,
  },
  emptyTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: Colors.ink,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.muted,
    textAlign: 'center',
  },
});
