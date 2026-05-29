import { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { parseISO, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, Flame, Trophy, TrendingUp, Hash } from 'lucide-react-native';
import Constants from 'expo-constants';
import { useHabitDetailedStats } from '@/hooks/useHabits';
import { Colors, Gradients, Spacing, Radius, Shadows, Typography } from '@/tokens';

// ─── types ────────────────────────────────────────────────────────────────────

interface DayCell {
  date: string;
  completed: boolean;
  shouldComplete: boolean;
  value: number | null;
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  icon,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  accent?: string;
}) {
  return (
    <View style={[sStyles.statCard, accent ? { borderTopColor: accent, borderTopWidth: 3 } : null]}>
      <View style={sStyles.statIcon}>{icon}</View>
      <Text style={sStyles.statValue}>{value}</Text>
      <Text style={sStyles.statLabel}>{label}</Text>
      {sub ? <Text style={sStyles.statSub}>{sub}</Text> : null}
    </View>
  );
}

// ─── DayGrid ──────────────────────────────────────────────────────────────────

function DayGrid({ days, habitColor }: { days: DayCell[]; habitColor: string }) {
  const today = format(new Date(), 'yyyy-MM-dd');

  return (
    <View style={sStyles.gridWrap}>
      {days.map((d, i) => {
        const isToday = d.date === today;
        const isFuture = d.date > today;

        let bg = Colors.bgMid;
        let textColor = Colors.muted;

        if (!isFuture) {
          if (!d.shouldComplete) {
            bg = Colors.line;
            textColor = Colors.muted;
          } else if (d.completed) {
            bg = habitColor;
            textColor = '#fff';
          } else {
            bg = '#FEE2E2';
            textColor = '#EF4444';
          }
        }

        const dayNum = parseISO(d.date).getDate();

        return (
          <View
            key={i}
            style={[sStyles.dayCell, { backgroundColor: bg }, isToday && sStyles.dayCellToday]}
          >
            <Text style={[sStyles.dayCellText, { color: textColor }]}>{dayNum}</Text>
          </View>
        );
      })}
    </View>
  );
}

// ─── NumericBars ──────────────────────────────────────────────────────────────

function NumericBars({
  values,
  targetValue,
  unit,
  habitColor,
}: {
  values: Array<{ date: string; value: number | null }>;
  targetValue?: number | null;
  unit?: string;
  habitColor: string;
}) {
  const maxVal = useMemo(
    () => Math.max(...values.map((v) => v.value ?? 0), targetValue ?? 0, 1),
    [values, targetValue]
  );

  return (
    <View style={sStyles.barsContainer}>
      {values.map((v, i) => {
        const pct = v.value != null ? Math.min(v.value / maxVal, 1) : 0;
        const targetPct = targetValue ? Math.min(targetValue / maxVal, 1) : null;
        const dayNum = parseISO(v.date).getDate();
        return (
          <View key={i} style={sStyles.barCol}>
            <View style={sStyles.barTrack}>
              {targetPct != null && (
                <View style={[sStyles.barTarget, { bottom: `${targetPct * 100}%` as any }]} />
              )}
              <View
                style={[
                  sStyles.barFill,
                  { height: `${pct * 100}%` as any, backgroundColor: habitColor },
                ]}
              />
            </View>
            <Text style={sStyles.barDayLabel}>{dayNum}</Text>
            {v.value != null && (
              <Text style={sStyles.barValLabel}>
                {v.value}
                {unit ? ` ${unit}` : ''}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

// ─── screen ───────────────────────────────────────────────────────────────────

export default function HabitStatsScreen() {
  const params = useLocalSearchParams<{
    id: string;
    name: string;
    color: string;
    type: string;
  }>();

  const habitId = params.id ?? '';
  const habitName = params.name ?? 'Hábito';
  const habitColor = params.color && params.color !== '' ? params.color : Colors.vivid;
  const isNumeric = params.type === 'NUMERIC';

  const { data, isLoading } = useHabitDetailedStats(habitId);

  // Pad last30DaysData to 30 entries if shorter (new habits)
  const days = useMemo<DayCell[]>(() => {
    if (!data) return [];
    const raw = data.last30DaysData ?? [];
    return raw.map((d) => ({
      date: d.date,
      completed: d.completed,
      shouldComplete: d.shouldComplete,
      value: d.value,
    }));
  }, [data]);

  const overallPct = data ? Math.round(data.overallCompletionRate) : 0;
  const last30Pct = data ? Math.round(data.last30DaysRate) : 0;

  const topInset = Constants.statusBarHeight ?? 44;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bgTop }}>
      {/* ─── Header ───────────────────────────────────────────────── */}
      <LinearGradient
        colors={Gradients.nudge}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[sStyles.header, { paddingTop: topInset + 12 }]}
      >
        <TouchableOpacity onPress={() => router.back()} style={sStyles.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={20} color="#fff" strokeWidth={2} />
        </TouchableOpacity>

        <View style={sStyles.headerCenter}>
          {habitColor !== Colors.vivid && (
            <View style={[sStyles.habitDot, { backgroundColor: habitColor }]} />
          )}
          <Text style={sStyles.headerTitle} numberOfLines={1}>
            {habitName}
          </Text>
        </View>

        <View style={{ width: 36 }} />
      </LinearGradient>

      {isLoading ? (
        <ActivityIndicator color={Colors.vivid} style={{ marginTop: 48 }} />
      ) : !data ? (
        <View style={sStyles.emptyState}>
          <Text style={sStyles.emptyText}>Sin estadísticas disponibles</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={sStyles.content} showsVerticalScrollIndicator={false}>
          {/* ─── Rachas ─────────────────────────────────────────── */}
          <Text style={sStyles.sectionTitle}>Rachas</Text>
          <View style={sStyles.statRow}>
            <StatCard
              label="Racha actual"
              value={`${data.currentStreak}d`}
              sub="días consecutivos"
              icon={<Flame size={18} color="#F59E0B" />}
              accent="#F59E0B"
            />
            <StatCard
              label="Racha máxima"
              value={`${data.longestStreak}d`}
              sub="récord histórico"
              icon={<Trophy size={18} color="#8B5CF6" />}
              accent="#8B5CF6"
            />
          </View>

          {/* ─── Cumplimiento ─────────────────────────────────── */}
          <Text style={sStyles.sectionTitle}>Cumplimiento</Text>
          <View style={sStyles.statRow}>
            <StatCard
              label="General"
              value={`${overallPct}%`}
              sub="desde el inicio"
              icon={<TrendingUp size={18} color={Colors.vivid} />}
              accent={Colors.vivid}
            />
            <StatCard
              label="Últimos 30 días"
              value={`${last30Pct}%`}
              sub={`${data.totalCompletions} completadas`}
              icon={<Hash size={18} color="#10B981" />}
              accent="#10B981"
            />
          </View>

          {/* ─── Rate bar ─────────────────────────────────────── */}
          <View style={sStyles.rateBar}>
            <View style={sStyles.rateBarBg}>
              <LinearGradient
                colors={['#1E6BFF', '#10B981']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[sStyles.rateBarFill, { width: `${Math.min(last30Pct, 100)}%` as any }]}
              />
            </View>
            <Text style={sStyles.rateBarLabel}>{last30Pct}% en los últimos 30 días</Text>
          </View>

          {/* ─── Calendario 30 días ───────────────────────────── */}
          <Text style={sStyles.sectionTitle}>Últimos 30 días</Text>
          <View style={sStyles.legendRow}>
            <View style={sStyles.legendItem}>
              <View style={[sStyles.legendDot, { backgroundColor: habitColor }]} />
              <Text style={sStyles.legendText}>Completado</Text>
            </View>
            <View style={sStyles.legendItem}>
              <View style={[sStyles.legendDot, { backgroundColor: '#FEE2E2' }]} />
              <Text style={sStyles.legendText}>Incumplido</Text>
            </View>
            <View style={sStyles.legendItem}>
              <View style={[sStyles.legendDot, { backgroundColor: Colors.line }]} />
              <Text style={sStyles.legendText}>No programado</Text>
            </View>
          </View>
          <View style={sStyles.calCard}>
            <DayGrid days={days} habitColor={habitColor} />
          </View>

          {/* ─── Numeric stats ────────────────────────────────── */}
          {isNumeric && data.averageValue != null && (
            <>
              <Text style={sStyles.sectionTitle}>Estadísticas de valor</Text>
              <View style={sStyles.statRow}>
                <View style={sStyles.numCard}>
                  <Text style={sStyles.numVal}>{data.averageValue?.toFixed(1) ?? '—'}</Text>
                  <Text style={sStyles.numLabel}>Promedio</Text>
                </View>
                <View style={sStyles.numCard}>
                  <Text style={sStyles.numVal}>{data.minValue ?? '—'}</Text>
                  <Text style={sStyles.numLabel}>Mínimo</Text>
                </View>
                <View style={sStyles.numCard}>
                  <Text style={sStyles.numVal}>{data.maxValue ?? '—'}</Text>
                  <Text style={sStyles.numLabel}>Máximo</Text>
                </View>
              </View>

              {data.last30DaysValues && data.last30DaysValues.length > 0 && (
                <>
                  <Text style={sStyles.sectionTitle}>Evolución</Text>
                  <View style={sStyles.calCard}>
                    <NumericBars
                      values={data.last30DaysValues.slice(-20)}
                      habitColor={habitColor}
                    />
                  </View>
                </>
              )}
            </>
          )}

          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </View>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────

const CELL_SIZE = 38;
const GRID_COLS = 6;

const sStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenX,
    paddingBottom: 20,
    gap: Spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  habitDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  headerTitle: {
    ...Typography.displaySm,
    color: '#fff',
    flex: 1,
  },

  content: {
    paddingHorizontal: Spacing.screenX,
    paddingTop: Spacing.xl,
  },

  sectionTitle: {
    ...Typography.bodyStrong,
    color: Colors.ink,
    marginBottom: Spacing.sm,
    marginTop: Spacing.xl,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 11,
  },

  statRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surfaceSolid,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.line,
    padding: Spacing.lg,
    alignItems: 'flex-start',
    gap: 4,
    ...Shadows.account,
  },
  statIcon: { marginBottom: 4 },
  statValue: {
    ...Typography.displaySm,
    color: Colors.ink,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.ink,
    fontWeight: '600',
  },
  statSub: {
    ...Typography.meta,
    color: Colors.muted,
  },

  rateBar: {
    marginBottom: Spacing.md,
  },
  rateBarBg: {
    height: 8,
    backgroundColor: Colors.bgMid,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  rateBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  rateBarLabel: {
    ...Typography.caption,
    color: Colors.muted,
    textAlign: 'right',
  },

  legendRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  legendText: {
    ...Typography.meta,
    color: Colors.muted,
  },

  calCard: {
    backgroundColor: Colors.surfaceSolid,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.line,
    padding: Spacing.md,
    ...Shadows.account,
  },

  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  dayCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellToday: {
    borderWidth: 2,
    borderColor: Colors.ink,
  },
  dayCellText: {
    ...Typography.metaStrong,
  },

  numCard: {
    flex: 1,
    backgroundColor: Colors.surfaceSolid,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.line,
    padding: Spacing.lg,
    alignItems: 'center',
    ...Shadows.account,
  },
  numVal: {
    ...Typography.displaySm,
    color: Colors.ink,
    marginBottom: 2,
  },
  numLabel: {
    ...Typography.meta,
    color: Colors.muted,
  },

  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 100,
    gap: 3,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
  },
  barTrack: {
    flex: 1,
    width: '100%',
    backgroundColor: Colors.bgMid,
    borderRadius: 3,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  barFill: {
    width: '100%',
    borderRadius: 3,
    minHeight: 2,
  },
  barTarget: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1.5,
    backgroundColor: '#EF4444',
    zIndex: 1,
  },
  barDayLabel: {
    ...Typography.micro,
    color: Colors.muted,
    marginTop: 3,
  },
  barValLabel: {
    ...Typography.micro,
    color: Colors.vivid,
    fontWeight: '700',
  },

  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 64,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.muted,
  },
});
