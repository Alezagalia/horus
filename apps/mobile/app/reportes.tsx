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
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, TrendingUp, TrendingDown, Minus, Lightbulb, X } from 'lucide-react-native';
import { Chip } from '@/components/ui/Chip';
import { Card } from '@/components/ui/Card';
import { Colors, Spacing, Radius, Gradients, Shadows } from '@/tokens';
import {
  useOverviewAnalytics,
  useProductivityAnalytics,
  useCompareAnalytics,
} from '@/hooks/useAnalytics';
import { useInsights, useDismissInsight } from '@/hooks/useInsights';
import type { Insight } from '@horus/shared';

// ─── helpers ──────────────────────────────────────────────────────────────────

const DAYS_OF_WEEK = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function pct(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

function currency(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
  return `$${Math.round(n)}`;
}

function kgVol(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)}t`;
  return `${Math.round(kg)} kg`;
}

type PeriodDays = 7 | 30 | 90;
type CompareMode = 'week' | 'month';

// ─── Overview tab ─────────────────────────────────────────────────────────────

function OverviewTab({ days }: { days: PeriodDays }) {
  const { data, isLoading } = useOverviewAnalytics(days);

  if (isLoading) return <ActivityIndicator color={Colors.vivid} style={{ marginTop: 32 }} />;
  if (!data) return null;

  const { habits, tasks, finance, workouts, goals } = data;

  return (
    <>
      <View style={styles.overviewGrid}>
        <OverviewCard
          emoji="🎯"
          label="Hábitos"
          value={String(habits.totalCompletions)}
          sub={`${pct(habits.completionRate)} adherencia`}
          accent="#6366F1"
          bar={habits.completionRate}
        />
        <OverviewCard
          emoji="✅"
          label="Tareas"
          value={String(tasks.completed)}
          sub={`${tasks.overdue} vencidas`}
          accent="#10B981"
          bar={tasks.completionRate}
        />
        <OverviewCard
          emoji="💸"
          label="Finanzas"
          value={currency(finance.net)}
          sub={`${currency(finance.income)} ingreso / ${currency(finance.expense)} gasto`}
          accent={finance.net >= 0 ? '#10B981' : '#EF4444'}
        />
        <OverviewCard
          emoji="💪"
          label="Workouts"
          value={String(workouts.completed)}
          sub={kgVol(workouts.totalVolume) + ' volumen'}
          accent="#F59E0B"
        />
        <OverviewCard
          emoji="🏆"
          label="Metas"
          value={String(goals.active)}
          sub={`${pct(goals.averageProgress)} promedio · ${goals.completedInPeriod} completadas`}
          accent="#8B5CF6"
          bar={goals.averageProgress}
        />
      </View>

      {habits.longestStreakInPeriod > 0 && (
        <Card solid style={styles.streakCard}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <View>
            <Text style={styles.streakValue}>{habits.longestStreakInPeriod} días</Text>
            <Text style={styles.streakLabel}>racha más larga en el período</Text>
          </View>
        </Card>
      )}
    </>
  );
}

function OverviewCard({
  emoji,
  label,
  value,
  sub,
  accent,
  bar,
}: {
  emoji: string;
  label: string;
  value: string;
  sub: string;
  accent: string;
  bar?: number;
}) {
  return (
    <Card solid style={styles.overviewCard}>
      <View style={styles.overviewCardTop}>
        <Text style={styles.overviewEmoji}>{emoji}</Text>
        <Text style={styles.overviewLabel}>{label}</Text>
      </View>
      <Text style={[styles.overviewValue, { color: accent }]}>{value}</Text>
      <Text style={styles.overviewSub} numberOfLines={2}>
        {sub}
      </Text>
      {bar != null && (
        <View style={styles.overviewBar}>
          <View
            style={[
              styles.overviewBarFill,
              { width: `${Math.min(100, Math.round(bar * 100))}%` as any, backgroundColor: accent },
            ]}
          />
        </View>
      )}
    </Card>
  );
}

// ─── Productivity tab ─────────────────────────────────────────────────────────

function ProductivityTab({ days }: { days: PeriodDays }) {
  const { data, isLoading } = useProductivityAnalytics(days);

  if (isLoading) return <ActivityIndicator color={Colors.vivid} style={{ marginTop: 32 }} />;
  if (!data) return null;

  const maxDay = Math.max(...data.byDayOfWeek.map((d) => d.completed), 1);
  const topHours = [...data.byHourOfDay].sort((a, b) => b.completed - a.completed).slice(0, 6);
  const maxHour = topHours[0]?.completed ?? 1;

  return (
    <>
      {/* Best day + hour summary */}
      {(data.bestDayOfWeek || data.bestHour) && (
        <View style={styles.bestRow}>
          {data.bestDayOfWeek && (
            <Card solid style={[styles.bestCard, { flex: 1 }]}>
              <Text style={styles.bestEmoji}>📅</Text>
              <Text style={styles.bestValue}>{DAYS_OF_WEEK[data.bestDayOfWeek.dayOfWeek]}</Text>
              <Text style={styles.bestLabel}>Mejor día</Text>
              <Text style={styles.bestSub}>{data.bestDayOfWeek.completed} tareas</Text>
            </Card>
          )}
          {data.bestHour && (
            <Card solid style={[styles.bestCard, { flex: 1 }]}>
              <Text style={styles.bestEmoji}>⏰</Text>
              <Text style={styles.bestValue}>{data.bestHour.hour}:00</Text>
              <Text style={styles.bestLabel}>Mejor hora</Text>
              <Text style={styles.bestSub}>{data.bestHour.completed} tareas</Text>
            </Card>
          )}
        </View>
      )}

      {/* Day of week bars */}
      <SectionHeader title="POR DÍA DE SEMANA" count={data.totalCompleted} />
      <Card solid style={{ marginBottom: Spacing.xl }}>
        {data.byDayOfWeek.map((d) => (
          <View key={d.dayOfWeek} style={styles.barRow}>
            <Text style={styles.barLabel}>{DAYS_OF_WEEK[d.dayOfWeek]}</Text>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: `${Math.round((d.completed / maxDay) * 100)}%` as any,
                    backgroundColor:
                      data.bestDayOfWeek?.dayOfWeek === d.dayOfWeek
                        ? Colors.vivid
                        : Colors.ceilLight,
                  },
                ]}
              />
            </View>
            <Text style={styles.barValue}>{d.completed}</Text>
          </View>
        ))}
      </Card>

      {/* Top hours */}
      {topHours.length > 0 && (
        <>
          <SectionHeader title="MEJORES HORAS" />
          <Card solid style={{ marginBottom: Spacing.xl }}>
            {topHours.map((h) => (
              <View key={h.hour} style={styles.barRow}>
                <Text style={styles.barLabel}>{`${h.hour}:00`}</Text>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${Math.round((h.completed / maxHour) * 100)}%` as any,
                        backgroundColor: data.bestHour?.hour === h.hour ? '#F59E0B' : '#FEF3C7',
                      },
                    ]}
                  />
                </View>
                <Text style={styles.barValue}>{h.completed}</Text>
              </View>
            ))}
          </Card>
        </>
      )}
    </>
  );
}

// ─── Compare tab ──────────────────────────────────────────────────────────────

const COMPARE_LABELS: Record<string, { label: string; emoji: string; higherIsBetter: boolean }> = {
  'habits.completions': { label: 'Hábitos completados', emoji: '🎯', higherIsBetter: true },
  'tasks.completed': { label: 'Tareas completadas', emoji: '✅', higherIsBetter: true },
  'finance.income': { label: 'Ingresos', emoji: '💚', higherIsBetter: true },
  'finance.expense': { label: 'Gastos', emoji: '💸', higherIsBetter: false },
  'workouts.completed': { label: 'Entrenamientos', emoji: '💪', higherIsBetter: true },
};

function CompareTab() {
  const [mode, setMode] = useState<CompareMode>('week');
  const { data, isLoading } = useCompareAnalytics(mode);

  return (
    <>
      <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg }}>
        <Chip label="Semana vs semana" active={mode === 'week'} onPress={() => setMode('week')} />
        <Chip label="Mes vs mes" active={mode === 'month'} onPress={() => setMode('month')} />
      </View>

      {isLoading ? (
        <ActivityIndicator color={Colors.vivid} style={{ marginTop: 32 }} />
      ) : data ? (
        <>
          <View style={styles.comparePeriods}>
            <Text style={styles.comparePeriodLabel}>
              Actual: {format(parseISO(data.current.from), 'd MMM', { locale: es })} –{' '}
              {format(parseISO(data.current.to), 'd MMM yyyy', { locale: es })}
            </Text>
            <Text style={styles.comparePeriodLabel}>
              Anterior: {format(parseISO(data.previous.from), 'd MMM', { locale: es })} –{' '}
              {format(parseISO(data.previous.to), 'd MMM yyyy', { locale: es })}
            </Text>
          </View>

          <Card padding={0} solid>
            {Object.entries(data.metrics).map(([key, val], i, arr) => {
              const meta = COMPARE_LABELS[key];
              if (!meta) return null;
              const positive =
                val.delta > 0 ? meta.higherIsBetter : val.delta < 0 ? !meta.higherIsBetter : null;
              return (
                <View
                  key={key}
                  style={[styles.compareRow, i < arr.length - 1 && styles.compareRowBorder]}
                >
                  <Text style={styles.compareEmoji}>{meta.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.compareMetric}>{meta.label}</Text>
                    <Text style={styles.compareValues}>
                      {Math.round(val.current)} → {Math.round(val.previous)}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.deltaBadge,
                      positive === true && styles.deltaBadgeGood,
                      positive === false && styles.deltaBadgeBad,
                    ]}
                  >
                    {val.delta > 0 ? (
                      <TrendingUp size={11} color={positive ? '#065F46' : '#7F1D1D'} />
                    ) : val.delta < 0 ? (
                      <TrendingDown size={11} color={positive ? '#065F46' : '#7F1D1D'} />
                    ) : (
                      <Minus size={11} color={Colors.muted} />
                    )}
                    <Text
                      style={[
                        styles.deltaText,
                        positive === true && styles.deltaTextGood,
                        positive === false && styles.deltaTextBad,
                      ]}
                    >
                      {val.delta > 0 ? '+' : ''}
                      {val.deltaPercentage != null
                        ? `${Math.round(val.deltaPercentage)}%`
                        : `${Math.round(val.delta)}`}
                    </Text>
                  </View>
                </View>
              );
            })}
          </Card>
        </>
      ) : null}
    </>
  );
}

// ─── Insights tab ─────────────────────────────────────────────────────────────

const SEVERITY_STYLES: Record<
  Insight['severity'],
  { border: string; bg: string; badge: string; badgeText: string }
> = {
  positive: { border: '#10B981', bg: '#F0FDF4', badge: '#D1FAE5', badgeText: '#065F46' },
  neutral: { border: '#6366F1', bg: '#EEF2FF', badge: '#E0E7FF', badgeText: '#3730A3' },
  negative: { border: '#EF4444', bg: '#FEF2F2', badge: '#FEE2E2', badgeText: '#7F1D1D' },
};

const SEVERITY_LABELS: Record<Insight['severity'], string> = {
  positive: 'Positivo',
  neutral: 'Neutral',
  negative: 'Atención',
};

function InsightCard({ insight, onDismiss }: { insight: Insight; onDismiss: () => void }) {
  const s = SEVERITY_STYLES[insight.severity];
  return (
    <View style={[styles.insightCard, { borderLeftColor: s.border, backgroundColor: s.bg }]}>
      <View style={styles.insightTop}>
        <View style={[styles.severityBadge, { backgroundColor: s.badge }]}>
          <Text style={[styles.severityLabel, { color: s.badgeText }]}>
            {SEVERITY_LABELS[insight.severity]}
          </Text>
        </View>
        <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <X size={16} color={Colors.muted} />
        </TouchableOpacity>
      </View>
      <Text style={styles.insightTitle}>{insight.title}</Text>
      <Text style={styles.insightDesc}>{insight.description}</Text>
      {!insight.seenAt && (
        <View style={styles.newBadge}>
          <Text style={styles.newBadgeText}>Nuevo</Text>
        </View>
      )}
    </View>
  );
}

function InsightsTab() {
  const { data, isLoading } = useInsights();
  const dismiss = useDismissInsight();

  if (isLoading) return <ActivityIndicator color={Colors.vivid} style={{ marginTop: 32 }} />;

  if (!data) return null;

  if (data.notEnoughData) {
    return (
      <View style={styles.emptyWrap}>
        <Lightbulb size={40} color={Colors.ceilLight} strokeWidth={1} />
        <Text style={styles.emptyTitle}>Necesitás más datos</Text>
        <Text style={styles.emptySub}>
          Se necesitan al menos 60 días de actividad para detectar correlaciones. Actualmente tenés{' '}
          {data.daysOfData} días.
        </Text>
        <View style={styles.progressBarWrap}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${Math.min(100, (data.daysOfData / 60) * 100)}%` as any },
            ]}
          />
        </View>
        <Text style={styles.progressBarLabel}>{data.daysOfData} / 60 días</Text>
      </View>
    );
  }

  if (data.insights.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyEmoji}>✨</Text>
        <Text style={styles.emptyTitle}>Sin insights nuevos</Text>
        <Text style={styles.emptySub}>Volvé después de algunos días de actividad.</Text>
      </View>
    );
  }

  return (
    <>
      {data.insights.map((insight) => (
        <InsightCard
          key={insight.id}
          insight={insight}
          onDismiss={() => dismiss.mutate(insight.id)}
        />
      ))}
    </>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function SectionHeader({ title, count }: { title: string; count?: number }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {count != null && (
        <View style={styles.sectionBadge}>
          <Text style={styles.sectionBadgeText}>{count}</Text>
        </View>
      )}
    </View>
  );
}

// ─── Screen ────────────────────────────────────────────────────────────────────

type ReportTab = 'resumen' | 'productividad' | 'comparativo' | 'insights';

export default function ReportesScreen() {
  const [activeTab, setActiveTab] = useState<ReportTab>('resumen');
  const [periodDays, setPeriodDays] = useState<PeriodDays>(30);

  const { data: insightsData } = useInsights();
  const newInsights = insightsData?.insights.filter((i) => !i.seenAt).length ?? 0;

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
          <Text style={styles.headerTitle}>Reportes</Text>
          <Text style={styles.headerSub}>Tu progreso en números</Text>
        </View>
      </LinearGradient>

      {/* Tab bar */}
      <View style={styles.tabBarWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBar}
        >
          {(
            [
              { key: 'resumen', label: 'Resumen' },
              { key: 'productividad', label: 'Productividad' },
              { key: 'comparativo', label: 'Comparativo' },
              {
                key: 'insights',
                label: 'Insights',
                badge: newInsights > 0 ? newInsights : undefined,
              },
            ] as Array<{ key: ReportTab; label: string; badge?: number }>
          ).map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tabItem, activeTab === t.key && styles.tabItemActive]}
              onPress={() => setActiveTab(t.key)}
              activeOpacity={0.75}
            >
              <Text style={[styles.tabLabel, activeTab === t.key && styles.tabLabelActive]}>
                {t.label}
              </Text>
              {t.badge != null && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{t.badge}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Period selector (only for resumen + productividad) */}
        {(activeTab === 'resumen' || activeTab === 'productividad') && (
          <View style={styles.periodRow}>
            {([7, 30, 90] as PeriodDays[]).map((d) => (
              <Chip
                key={d}
                label={`${d}d`}
                active={periodDays === d}
                onPress={() => setPeriodDays(d)}
              />
            ))}
          </View>
        )}

        {activeTab === 'resumen' && <OverviewTab days={periodDays} />}
        {activeTab === 'productividad' && <ProductivityTab days={periodDays} />}
        {activeTab === 'comparativo' && <CompareTab />}
        {activeTab === 'insights' && <InsightsTab />}
      </ScrollView>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
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
  // Tab bar
  tabBarWrap: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.screenX,
    paddingVertical: Spacing.sm,
    gap: 4,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.pill,
  },
  tabItemActive: {
    backgroundColor: Colors.vivid,
  },
  tabLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: Colors.muted,
  },
  tabLabelActive: {
    color: '#fff',
    fontFamily: 'Inter_600SemiBold',
  },
  tabBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 9,
    color: '#fff',
  },
  // Content
  content: {
    padding: Spacing.screenX,
    paddingBottom: 40,
  },
  periodRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  // Overview
  overviewGrid: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  overviewCard: {
    marginBottom: 0,
  },
  overviewCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  overviewEmoji: {
    fontSize: 16,
  },
  overviewLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: Colors.muted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  overviewValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 26,
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  overviewSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: Colors.muted,
    marginBottom: 6,
  },
  overviewBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.ice,
    overflow: 'hidden',
  },
  overviewBarFill: {
    height: 4,
    borderRadius: 2,
  },
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  streakEmoji: { fontSize: 28 },
  streakValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: '#F97316',
    letterSpacing: -0.3,
  },
  streakLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.muted,
  },
  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    color: Colors.muted,
    letterSpacing: 1,
  },
  sectionBadge: {
    backgroundColor: Colors.ice,
    borderRadius: Radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  sectionBadgeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    color: Colors.vivid,
  },
  // Productivity
  bestRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  bestCard: {
    alignItems: 'center',
    gap: 2,
  },
  bestEmoji: { fontSize: 22 },
  bestValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: Colors.vivid,
    letterSpacing: -0.3,
  },
  bestLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    color: Colors.muted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  bestSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: Colors.muted,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 9,
  },
  barLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: Colors.muted,
    width: 36,
  },
  barTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.ice,
    overflow: 'hidden',
  },
  barFill: {
    height: 8,
    borderRadius: 4,
  },
  barValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    color: Colors.ink,
    width: 28,
    textAlign: 'right',
  },
  // Compare
  comparePeriods: {
    gap: 2,
    marginBottom: Spacing.md,
  },
  comparePeriodLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: Colors.muted,
  },
  compareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 13,
  },
  compareRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.ice,
  },
  compareEmoji: { fontSize: 16 },
  compareMetric: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: Colors.ink,
  },
  compareValues: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: Colors.muted,
    marginTop: 1,
  },
  deltaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.ice,
    borderRadius: Radius.sm,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  deltaBadgeGood: { backgroundColor: '#D1FAE5' },
  deltaBadgeBad: { backgroundColor: '#FEE2E2' },
  deltaText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    color: Colors.muted,
  },
  deltaTextGood: { color: '#065F46' },
  deltaTextBad: { color: '#7F1D1D' },
  // Insights
  insightCard: {
    borderLeftWidth: 3,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  insightTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  severityBadge: {
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  severityLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
  },
  insightTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: Colors.ink,
    marginBottom: 4,
    lineHeight: 20,
  },
  insightDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.muted,
    lineHeight: 18,
  },
  newBadge: {
    alignSelf: 'flex-start',
    marginTop: 8,
    backgroundColor: '#DBEAFE',
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  newBadgeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    color: '#1E40AF',
  },
  // Empty
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: Spacing.sm,
  },
  emptyEmoji: { fontSize: 44 },
  emptyTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
    color: Colors.ink,
  },
  emptySub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.muted,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 19,
  },
  progressBarWrap: {
    width: 200,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.ice,
    overflow: 'hidden',
    marginTop: Spacing.md,
  },
  progressBarFill: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.vivid,
  },
  progressBarLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: Colors.muted,
  },
});
