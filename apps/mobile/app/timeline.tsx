import { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { format, parseISO, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, Scroll } from 'lucide-react-native';
import { Chip } from '@/components/ui/Chip';
import { Card } from '@/components/ui/Card';
import { Colors, Spacing, Radius, Gradients, Shadows } from '@/tokens';
import { useTimeline } from '@/hooks/useTimeline';
import type {
  TimelineEvent,
  TimelineModule,
  TimelineEventCategory,
} from '@/services/api/timelineApi';

// ─── constants ─────────────────────────────────────────────────────────────────

const MODULE_OPTIONS: Array<{ key: TimelineModule; label: string; emoji: string }> = [
  { key: 'habits', label: 'Hábitos', emoji: '🎯' },
  { key: 'tasks', label: 'Tareas', emoji: '✅' },
  { key: 'workouts', label: 'Entrenam.', emoji: '💪' },
  { key: 'goals', label: 'Metas', emoji: '🏆' },
  { key: 'finance', label: 'Finanzas', emoji: '💸' },
  { key: 'resources', label: 'Recursos', emoji: '📚' },
];

const CATEGORY_OPTIONS: Array<{ key: TimelineEventCategory; label: string }> = [
  { key: 'first', label: 'Primera vez' },
  { key: 'completed', label: 'Completado' },
  { key: 'anniversary', label: 'Aniversario' },
  { key: 'milestone', label: 'Hito' },
];

const CATEGORY_COLORS: Record<TimelineEventCategory, string> = {
  first: '#6366F1',
  completed: '#10B981',
  anniversary: '#F59E0B',
  milestone: '#8B5CF6',
};

const CATEGORY_BG: Record<TimelineEventCategory, string> = {
  first: '#EEF2FF',
  completed: '#ECFDF5',
  anniversary: '#FFFBEB',
  milestone: '#F5F3FF',
};

// ─── helpers ──────────────────────────────────────────────────────────────────

function categoryLabel(cat: TimelineEventCategory): string {
  const map: Record<TimelineEventCategory, string> = {
    first: 'Primera vez',
    completed: 'Completado',
    anniversary: 'Aniversario',
    milestone: 'Hito',
  };
  return map[cat];
}

function moduleEmoji(mod: TimelineModule): string {
  const map: Record<TimelineModule, string> = {
    habits: '🎯',
    tasks: '✅',
    workouts: '💪',
    goals: '🏆',
    finance: '💸',
    resources: '📚',
  };
  return map[mod];
}

function formatEventDate(dateStr: string): string {
  return format(parseISO(`${dateStr}T12:00:00`), "d 'de' MMMM yyyy", { locale: es });
}

function getYear(dateStr: string): string {
  return dateStr.slice(0, 4);
}

// ─── Event card ────────────────────────────────────────────────────────────────

function EventCard({ event }: { event: TimelineEvent }) {
  const borderColor = CATEGORY_COLORS[event.category];
  const tagBg = CATEGORY_BG[event.category];
  const tagColor = CATEGORY_COLORS[event.category];
  const todayEvent = isToday(parseISO(`${event.date}T12:00:00`));

  return (
    <View style={[styles.eventCard, { borderLeftColor: borderColor }]}>
      <View style={styles.eventTop}>
        <Text style={styles.eventEmoji}>{moduleEmoji(event.module)}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.eventTitle} numberOfLines={2}>
            {event.title}
          </Text>
          {event.description ? (
            <Text style={styles.eventDesc} numberOfLines={2}>
              {event.description}
            </Text>
          ) : null}
        </View>
      </View>
      <View style={styles.eventFooter}>
        <View style={[styles.catTag, { backgroundColor: tagBg }]}>
          <Text style={[styles.catTagLabel, { color: tagColor }]}>
            {categoryLabel(event.category)}
          </Text>
        </View>
        <Text style={[styles.eventDate, todayEvent && styles.eventDateToday]}>
          {todayEvent ? 'Hoy' : formatEventDate(event.date)}
        </Text>
      </View>
    </View>
  );
}

// ─── Anniversary banner ────────────────────────────────────────────────────────

function AnniversaryBanner({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) return null;
  return (
    <LinearGradient
      colors={['#F59E0B', '#EF4444']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.anniversaryBanner}
    >
      <Text style={styles.anniversaryTitle}>🎉 Aniversarios de hoy</Text>
      {events.map((ev) => (
        <Text key={ev.id} style={styles.anniversaryItem} numberOfLines={1}>
          • {ev.title}
        </Text>
      ))}
    </LinearGradient>
  );
}

// ─── Screen ────────────────────────────────────────────────────────────────────

export default function TimelineScreen() {
  const [activeModules, setActiveModules] = useState<TimelineModule[]>([]);
  const [activeCategories, setActiveCategories] = useState<TimelineEventCategory[]>([]);

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useTimeline(
    activeModules.length ? activeModules : undefined,
    activeCategories.length ? activeCategories : undefined
  );

  const allEvents = useMemo(() => data?.pages.flatMap((p) => p.events) ?? [], [data]);

  const totalCount = data?.pages[0]?.total ?? 0;

  // Group events by year
  const groupedByYear = useMemo(() => {
    const map = new Map<string, TimelineEvent[]>();
    for (const ev of allEvents) {
      const yr = getYear(ev.date);
      if (!map.has(yr)) map.set(yr, []);
      map.get(yr)!.push(ev);
    }
    // Return sorted descending
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [allEvents]);

  // Anniversaries today
  const anniversariesToday = useMemo(
    () =>
      allEvents.filter(
        (ev) => ev.category === 'anniversary' && isToday(parseISO(`${ev.date}T12:00:00`))
      ),
    [allEvents]
  );

  function toggleModule(mod: TimelineModule) {
    setActiveModules((prev) =>
      prev.includes(mod) ? prev.filter((m) => m !== mod) : [...prev, mod]
    );
  }

  function toggleCategory(cat: TimelineEventCategory) {
    setActiveCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  return (
    <View style={styles.root}>
      {/* Header */}
      <LinearGradient
        colors={Gradients.nudge}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ChevronLeft size={24} color="#fff" strokeWidth={1.5} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Mi Historia</Text>
          <Text style={styles.headerSub}>Arqueología personal</Text>
        </View>
        {totalCount > 0 && (
          <View style={styles.headerBadge}>
            <Scroll size={13} color="#fff" strokeWidth={1.5} />
            <Text style={styles.headerBadgeText}>{totalCount}</Text>
          </View>
        )}
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Module filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterRow}
          contentContainerStyle={{ gap: Spacing.sm, paddingRight: Spacing.screenX }}
        >
          {MODULE_OPTIONS.map((m) => (
            <Chip
              key={m.key}
              label={`${m.emoji} ${m.label}`}
              active={activeModules.includes(m.key)}
              onPress={() => toggleModule(m.key)}
            />
          ))}
        </ScrollView>

        {/* Category filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterRow}
          contentContainerStyle={{ gap: Spacing.sm, paddingRight: Spacing.screenX }}
        >
          {CATEGORY_OPTIONS.map((c) => (
            <Chip
              key={c.key}
              label={c.label}
              active={activeCategories.includes(c.key)}
              onPress={() => toggleCategory(c.key)}
            />
          ))}
        </ScrollView>

        {isLoading ? (
          <ActivityIndicator color={Colors.vivid} style={{ marginTop: 48 }} />
        ) : allEvents.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyEmoji}>📜</Text>
            <Text style={styles.emptyTitle}>Sin eventos</Text>
            <Text style={styles.emptySub}>
              {activeModules.length || activeCategories.length
                ? 'No hay eventos con esos filtros'
                : 'Tu historia aparecerá aquí a medida que uses la app'}
            </Text>
            {(activeModules.length > 0 || activeCategories.length > 0) && (
              <TouchableOpacity
                style={styles.clearBtn}
                onPress={() => {
                  setActiveModules([]);
                  setActiveCategories([]);
                }}
              >
                <Text style={styles.clearBtnLabel}>Limpiar filtros</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <>
            {/* Anniversaries today banner */}
            <AnniversaryBanner events={anniversariesToday} />

            {/* Year groups */}
            {groupedByYear.map(([year, events]) => (
              <View key={year}>
                <View style={styles.yearHeader}>
                  <Text style={styles.yearText}>{year}</Text>
                  <View style={styles.yearLine} />
                  <View style={styles.yearBadge}>
                    <Text style={styles.yearBadgeText}>{events.length}</Text>
                  </View>
                </View>
                {events.map((ev) => (
                  <EventCard key={ev.id} event={ev} />
                ))}
              </View>
            ))}

            {/* Load more */}
            {hasNextPage && (
              <TouchableOpacity
                style={styles.loadMoreBtn}
                onPress={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                activeOpacity={0.8}
              >
                {isFetchingNextPage ? (
                  <ActivityIndicator size="small" color={Colors.vivid} />
                ) : (
                  <Text style={styles.loadMoreLabel}>Cargar más</Text>
                )}
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bgTop,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingTop: Platform.OS === 'android' ? 48 : 60,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.screenX,
    ...Shadows.nav,
  },
  headerTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: '#fff',
    letterSpacing: -0.3,
  },
  headerSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 1,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  headerBadgeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    color: '#fff',
  },
  content: {
    padding: Spacing.screenX,
    paddingBottom: 40,
  },
  filterRow: {
    marginBottom: Spacing.md,
    marginHorizontal: -Spacing.screenX,
    paddingLeft: Spacing.screenX,
  },
  // Anniversaries
  anniversaryBanner: {
    borderRadius: Radius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    gap: 4,
  },
  anniversaryTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: '#fff',
    marginBottom: 4,
  },
  anniversaryItem: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
  },
  // Year header
  yearHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  yearText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: Colors.ink,
    letterSpacing: -0.3,
  },
  yearLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.line,
  },
  yearBadge: {
    backgroundColor: Colors.ice,
    borderRadius: Radius.sm,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  yearBadgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: Colors.vivid,
  },
  // Event card
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: Radius.xl,
    borderLeftWidth: 3,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.card,
  },
  eventTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  eventEmoji: {
    fontSize: 20,
    lineHeight: 24,
    marginTop: 1,
  },
  eventTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.ink,
    lineHeight: 20,
  },
  eventDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.muted,
    lineHeight: 17,
    marginTop: 2,
  },
  eventFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  catTag: {
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  catTagLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
  },
  eventDate: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: Colors.muted,
  },
  eventDateToday: {
    fontFamily: 'Inter_700Bold',
    color: '#F59E0B',
  },
  // Empty state
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 64,
    gap: Spacing.sm,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: Colors.ink,
  },
  emptySub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.muted,
    textAlign: 'center',
    maxWidth: 260,
  },
  clearBtn: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.vivid,
  },
  clearBtnLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: Colors.vivid,
  },
  // Load more
  loadMoreBtn: {
    marginTop: Spacing.lg,
    paddingVertical: 12,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.line,
    alignItems: 'center',
  },
  loadMoreLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: Colors.vivid,
  },
});
