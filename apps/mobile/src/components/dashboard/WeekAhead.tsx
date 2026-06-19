/**
 * WeekAhead — Resumen de la semana (mobile)
 * Combina tareas con vencimiento y eventos de los próximos 7 días,
 * agrupados por día y ordenados cronológicamente. Paridad con la web.
 */

import { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { format, isToday, isTomorrow, startOfDay, endOfDay, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card } from '@/components/ui/Card';
import { Colors, Spacing, Radius } from '@/tokens';
import type { Task, TaskPriority } from '@/services/api/taskApi';
import type { CalendarEvent } from '@/services/api/eventApi';

interface Props {
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
  priority?: TaskPriority | null;
  location?: string | null;
}

interface DayGroup {
  key: string;
  label: string;
  items: UpcomingItem[];
}

const MAX_ITEMS = 8;

const PRIORITY_COLORS: Record<TaskPriority, { bg: string; fg: string }> = {
  alta: { bg: '#FEE2E2', fg: '#B91C1C' },
  media: { bg: '#FEF3C7', fg: '#B45309' },
  baja: { bg: '#DCFCE7', fg: '#15803D' },
};

// Acentos por tipo (morado=evento, gris=tarea), como en la web.
const EVENT_ACCENT = { bg: '#EDE9FE', fg: '#6D28D9' };
const TASK_ACCENT = { bg: '#EEF1F7', fg: '#475569' };

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/**
 * Devuelve el icono sólo si es un emoji válido. Algunos datos guardan el icono
 * como nombre de componente lucide (p. ej. "Briefcase"); en ese caso usa el fallback.
 */
function resolveEmojiIcon(icon: string | null | undefined, fallback: string): string {
  const value = icon?.trim();
  if (!value) return fallback;
  return /^[A-Za-z]/.test(value) ? fallback : value;
}

/** Etiqueta del día: "Hoy", "Mañana" o "lun 3 de jun". */
function dayLabel(date: Date): string {
  if (isToday(date)) return 'Hoy';
  if (isTomorrow(date)) return 'Mañana';
  return format(date, "EEE d 'de' MMM", { locale: es });
}

export function WeekAhead({ tasks, events }: Props) {
  const { groups, hiddenCount } = useMemo(() => {
    const windowStart = startOfDay(new Date());
    const windowEnd = endOfDay(addDays(new Date(), 7));
    const inWindow = (d: Date) => d >= windowStart && d <= windowEnd;

    const items: UpcomingItem[] = [];

    // ── Tareas con vencimiento (no completadas / canceladas) ──────────────────
    tasks.forEach((task) => {
      if (task.status === 'completada' || task.status === 'cancelada' || !task.dueDate) return;
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
    <View>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Esta semana</Text>
          <Text style={styles.subtitle}>Próximas tareas y eventos (7 días)</Text>
        </View>
        <View style={styles.links}>
          <TouchableOpacity onPress={() => router.push('/(tabs)/foco')} activeOpacity={0.7}>
            <Text style={styles.link}>✅ Tareas</Text>
          </TouchableOpacity>
          <Text style={styles.sep}>·</Text>
          <TouchableOpacity onPress={() => router.push('/agenda')} activeOpacity={0.7}>
            <Text style={styles.link}>📅 Agenda</Text>
          </TouchableOpacity>
        </View>
      </View>

      {isEmpty ? (
        <Card solid>
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🗓️</Text>
            <Text style={styles.emptyTitle}>Semana despejada</Text>
            <Text style={styles.emptySub}>No hay tareas ni eventos en los próximos 7 días</Text>
          </View>
        </Card>
      ) : (
        <Card padding={Spacing.md} solid>
          {groups.map((group, gi) => (
            <View key={group.key} style={gi > 0 ? styles.groupGap : undefined}>
              {/* Separador de día */}
              <View style={styles.dayRow}>
                <Text style={styles.dayLabel}>{group.label}</Text>
                <View style={styles.dayLine} />
              </View>

              {/* Ítems del día */}
              {group.items.map((item) => {
                const accent = item.type === 'event' ? EVENT_ACCENT : TASK_ACCENT;
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={styles.itemRow}
                    activeOpacity={0.65}
                    onPress={() => router.push(item.type === 'task' ? '/(tabs)/foco' : '/agenda')}
                  >
                    <View style={[styles.iconBox, { backgroundColor: accent.bg }]}>
                      <Text style={styles.iconText}>{item.icon}</Text>
                    </View>

                    <View style={styles.itemBody}>
                      <Text style={styles.itemTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <View style={styles.metaRow}>
                        {item.timeLabel && <Text style={styles.time}>{item.timeLabel}</Text>}
                        {!!item.location && (
                          <Text style={styles.loc} numberOfLines={1}>
                            📍 {item.location}
                          </Text>
                        )}
                        {item.priority && (
                          <View
                            style={[
                              styles.badge,
                              { backgroundColor: PRIORITY_COLORS[item.priority].bg },
                            ]}
                          >
                            <Text
                              style={[
                                styles.badgeText,
                                { color: PRIORITY_COLORS[item.priority].fg },
                              ]}
                            >
                              {item.priority}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>

                    <View style={[styles.typeBadge, { backgroundColor: accent.bg }]}>
                      <Text style={[styles.typeBadgeText, { color: accent.fg }]}>
                        {item.type === 'event' ? 'Evento' : 'Tarea'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}

          {hiddenCount > 0 && (
            <TouchableOpacity
              onPress={() => router.push('/agenda')}
              style={styles.moreBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.moreText}>+{hiddenCount} más esta semana...</Text>
            </TouchableOpacity>
          )}
        </Card>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: Colors.ink,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.muted,
    marginTop: 2,
  },
  links: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 2,
  },
  link: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: Colors.vivid,
  },
  sep: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.muted,
  },

  groupGap: { marginTop: Spacing.md },

  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 4,
  },
  dayLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: Colors.vivid,
    textTransform: 'capitalize',
  },
  dayLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.line,
  },

  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 8,
  },
  iconBox: {
    width: 30,
    height: 30,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { fontSize: 15 },
  itemBody: { flex: 1, minWidth: 0 },
  itemTitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: Colors.ink,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  time: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: EVENT_ACCENT.fg,
  },
  loc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: Colors.muted,
    maxWidth: 140,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 5,
  },
  badgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    textTransform: 'capitalize',
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  typeBadgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
  },

  moreBtn: {
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 2,
  },
  moreText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: Colors.muted,
  },

  empty: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  emptyIcon: { fontSize: 32, marginBottom: 8, opacity: 0.5 },
  emptyTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.muted,
  },
  emptySub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.muted,
    textAlign: 'center',
    marginTop: 2,
  },
});
