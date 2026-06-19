import { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { format, startOfDay, endOfDay, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { Bell } from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Card } from '@/components/ui/Card';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { DailyTimeline } from '@/components/dashboard/DailyTimeline';
import { WeekAhead } from '@/components/dashboard/WeekAhead';
import { PendingExpenses } from '@/components/dashboard/PendingExpenses';
import { Colors, Spacing, Radius, Gradients, Shadows } from '@/tokens';
import { useAuthStore } from '@/store/authStore';
import { useHabits, useHabitStats, useToggleHabitComplete, habitKeys } from '@/hooks/useHabits';
import { useHabitMoments } from '@/hooks/useHabitMoments';
import { useTasks, taskKeys } from '@/hooks/useTasks';
import { useFeaturedGoal, goalKeys } from '@/hooks/useGoals';
import { useAccounts, useFinanceStats, accountKeys } from '@/hooks/useAccounts';
import { useMonthlyExpenses, monthlyExpenseKeys } from '@/hooks/useMonthlyExpenses';
import {
  useCalendarEvents,
  useRecurringExpensesCount,
  eventKeys,
  calendarEventKeys,
  recurringKeys,
} from '@/hooks/useEvents';
import type { Habit } from '@/services/api/habitApi';
import type { Task } from '@/services/api/taskApi';
import type { GoalWithProgress } from '@horus/shared';
import { useActivities, useToggleActivityRecord, activityKeys } from '@/hooks/useActivities';

// ─── helpers ──────────────────────────────────────────────────────────────────

// IMPORTANTE: estas fechas deben calcularse en cada render, NO a nivel de módulo.
// En React Native el bundle JS sobrevive al minimizar/restaurar la app, así que
// una constante de módulo quedaría congelada en el día en que se abrió la app por
// primera vez y mostraría hábitos de "ayer" como completados hoy (bug de agenda).
function getTodayDates() {
  const now = new Date();
  return {
    TODAY: format(now, 'yyyy-MM-dd'),
    TODAY_START: startOfDay(now).toISOString(),
    TODAY_END: endOfDay(now).toISOString(),
    WEEK_END: endOfDay(addDays(now, 7)).toISOString(),
    CUR_MONTH: now.getMonth() + 1, // API usa mes 1-indexado
    CUR_YEAR: now.getFullYear(),
  };
}

function isHabitDueToday(h: Habit): boolean {
  if (!h.isActive) return false;
  if (h.periodicity === 'DAILY') return true;
  if (h.periodicity === 'WEEKLY') return h.weekDays.includes(new Date().getDay());
  return true;
}

function isCompletedToday(h: Habit, today: string): boolean {
  return !!h.lastCompletedDate && h.lastCompletedDate.startsWith(today);
}

function isPending(t: Task): boolean {
  return t.status === 'pendiente' || t.status === 'en_progreso';
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function formatCompactBalance(amount: number, currency = 'ARS'): string {
  const prefix = currency === 'ARS' ? '$' : currency === 'USD' ? 'US$' : '$';
  const abs = Math.abs(amount);
  if (abs >= 1_000_000) return `${prefix}${(amount / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${prefix}${(amount / 1_000).toFixed(1)}k`;
  return `${prefix}${amount}`;
}

function getTodayLabel(): string {
  const raw = format(new Date(), 'EEEE, d MMM', { locale: es });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

// ─── PageHeader ───────────────────────────────────────────────────────────────

function PageHeader() {
  const user = useAuthStore((s) => s.user);
  const firstName = user?.name?.split(' ')[0] ?? '';
  const initials = user?.name ? getInitials(user.name) : '?';

  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.headerDate}>{getTodayLabel()}</Text>
        <Text style={styles.headerGreeting}>Hola, {firstName}</Text>
      </View>
      <View style={styles.headerRight}>
        <TouchableOpacity style={styles.bellBtn} activeOpacity={0.7}>
          <Bell size={18} color={Colors.ink} strokeWidth={1.5} />
        </TouchableOpacity>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
      </View>
    </View>
  );
}

// ─── HeroCard ─────────────────────────────────────────────────────────────────

function HeroCard({
  pct,
  done,
  total,
  longestStreak,
}: {
  pct: number;
  done: number;
  total: number;
  longestStreak: number;
}) {
  const pctInt = Math.round(pct * 100);
  return (
    <LinearGradient
      colors={Gradients.hero}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.hero}
    >
      <ProgressRing
        progress={pct}
        size={80}
        strokeWidth={8}
        theme="light"
        label={`${pctInt}%`}
        sublabel="del día"
      />
      <View style={styles.heroInfo}>
        <Text style={styles.heroSub}>Tu día</Text>
        <Text style={styles.heroMain}>
          {total === 0
            ? 'Sin hábitos para hoy'
            : done === total
              ? '¡Todos listos! 🎉'
              : `${done} de ${total} hábitos listos`}
        </Text>
        {longestStreak > 0 && (
          <Text style={styles.heroStreak}>🔥 Racha máx · {longestStreak} días</Text>
        )}
      </View>
    </LinearGradient>
  );
}

// ─── QuickStats ───────────────────────────────────────────────────────────────

function StatCard({ value, label, accent }: { value: string; label: string; accent?: boolean }) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, accent && { color: Colors.vivid }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─── FeaturedGoalCard ─────────────────────────────────────────────────────────

function FeaturedGoalCard({ goal }: { goal: GoalWithProgress }) {
  const pct = goal.progress ?? 0;
  return (
    <TouchableOpacity
      onPress={() => router.push({ pathname: '/meta-detalle', params: { id: goal.id } })}
      activeOpacity={0.85}
      style={styles.featuredGoal}
    >
      <View style={styles.featuredGoalHeader}>
        <Text style={styles.featuredGoalLabel}>⭐ META DESTACADA</Text>
        <Text style={styles.featuredGoalPct}>{pct}%</Text>
      </View>
      <Text style={styles.featuredGoalTitle} numberOfLines={2}>
        {goal.title}
      </Text>
      <View style={styles.featuredGoalBar}>
        <View style={[styles.featuredGoalFill, { width: `${Math.min(pct, 100)}%` }]} />
      </View>
      {(goal.linkedHabitsCount > 0 ||
        goal.linkedTasksCount > 0 ||
        (goal.keyResults?.length ?? 0) > 0) && (
        <View style={styles.featuredGoalMeta}>
          {(goal.keyResults?.length ?? 0) > 0 && (
            <Text style={styles.featuredGoalMetaText}>🎯 {goal.keyResults!.length} KRs</Text>
          )}
          {goal.linkedHabitsCount > 0 && (
            <Text style={styles.featuredGoalMetaText}>🔄 {goal.linkedHabitsCount} hábitos</Text>
          )}
          {goal.linkedTasksCount > 0 && (
            <Text style={styles.featuredGoalMetaText}>✅ {goal.linkedTasksCount} tareas</Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── screen ───────────────────────────────────────────────────────────────────

export default function HoyScreen() {
  const queryClient = useQueryClient();

  // Recalculado en cada render para no quedar congelado tras minimizar/restaurar.
  const { TODAY, TODAY_START, TODAY_END, WEEK_END, CUR_MONTH, CUR_YEAR } = getTodayDates();

  const { data: habits = [], isLoading: habitsLoading } = useHabits();
  const { data: stats } = useHabitStats();
  const { data: habitMoments = [] } = useHabitMoments();
  const { data: tasks = [], isLoading: tasksLoading } = useTasks();
  const { data: featuredGoal } = useFeaturedGoal();
  const { data: financeStats } = useFinanceStats();
  const { data: recurringCount = 0 } = useRecurringExpensesCount();
  const { data: todayEvents = [] } = useCalendarEvents(TODAY_START, TODAY_END);
  const { data: weekEvents = [] } = useCalendarEvents(TODAY_START, WEEK_END);
  const { data: todayActivities = [] } = useActivities(TODAY);
  const { data: accountsData } = useAccounts();
  const { data: monthlyData } = useMonthlyExpenses(CUR_MONTH, CUR_YEAR);

  const toggleHabit = useToggleHabitComplete();
  const toggleActivity = useToggleActivityRecord();

  const todayHabits = habits.filter(isHabitDueToday);
  const pendingTasks = tasks.filter(isPending).slice(0, 4);
  // Igual que dinero.tsx: usar las cuentas tal cual vienen (no filtrar por isActive,
  // que puede no venir en la respuesta y dejaría el selector de cuenta vacío).
  const activeAccounts = accountsData?.accounts ?? [];
  const monthlyExpenses = monthlyData?.monthlyExpenses ?? [];

  const pct = stats?.today.percentage ?? 0;
  const done = stats?.today.completed ?? 0;
  const total = stats?.today.total ?? 0;
  const longestStreak = stats?.streaks.longestEver ?? 0;

  const onRefresh = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: habitKeys.all }),
      queryClient.invalidateQueries({ queryKey: taskKeys.all }),
      queryClient.invalidateQueries({ queryKey: accountKeys.all }),
      queryClient.invalidateQueries({ queryKey: eventKeys.all }),
      queryClient.invalidateQueries({ queryKey: calendarEventKeys.all }),
      queryClient.invalidateQueries({ queryKey: recurringKeys.all }),
      queryClient.invalidateQueries({ queryKey: goalKeys.featured }),
      queryClient.invalidateQueries({ queryKey: activityKeys.all }),
      queryClient.invalidateQueries({ queryKey: monthlyExpenseKeys.all }),
    ]);
  }, [queryClient]);

  const handleToggleHabit = (habitId: string) => {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;
    const isDone = isCompletedToday(habit, TODAY);
    toggleHabit.mutate(
      { habitId, date: TODAY, completed: !isDone },
      { onError: () => Alert.alert('Error', 'No se pudo actualizar el hábito') }
    );
  };

  const handleToggleActivity = (activityId: string) => {
    const activity = todayActivities.find((a) => a.id === activityId);
    if (!activity) return;
    const isDone = activity.record?.completed ?? false;
    toggleActivity.mutate(
      { id: activityId, dto: { date: TODAY, completed: !isDone } },
      { onError: () => Alert.alert('Error', 'No se pudo actualizar la actividad') }
    );
  };

  const isLoading = habitsLoading && tasksLoading;

  // Responsive: en ventanas anchas (tablet / multiventana) usamos 2 columnas.
  const { width } = useWindowDimensions();
  const isWide = width >= 720;

  // ─── Sección Agenda (timeline) ───────────────────────────────
  const agendaSection = (
    <>
      <View style={styles.agendaHeader}>
        <Text style={styles.sectionTitle}>Agenda del día</Text>
        <View style={styles.agendaLinks}>
          <TouchableOpacity
            onPress={() =>
              router.navigate({ pathname: '/(tabs)/foco', params: { tab: 'habitos' } })
            }
            activeOpacity={0.7}
          >
            <Text style={styles.agendaLink}>🔄 Hábitos</Text>
          </TouchableOpacity>
          <Text style={styles.agendaSep}>·</Text>
          <TouchableOpacity onPress={() => router.push('/actividades')} activeOpacity={0.7}>
            <Text style={styles.agendaLink}>⚡ Actividades</Text>
          </TouchableOpacity>
          <Text style={styles.agendaSep}>·</Text>
          <TouchableOpacity onPress={() => router.push('/agenda')} activeOpacity={0.7}>
            <Text style={styles.agendaLink}>📅 Agenda</Text>
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator color={Colors.vivid} style={{ marginVertical: 16 }} />
      ) : (
        <Card padding={0} solid>
          <DailyTimeline
            habits={todayHabits}
            activities={todayActivities}
            events={todayEvents}
            habitMoments={habitMoments}
            onToggleHabit={handleToggleHabit}
            onToggleActivity={handleToggleActivity}
            togglingHabitId={toggleHabit.isPending ? toggleHabit.variables?.habitId : undefined}
            togglingActivityId={toggleActivity.isPending ? toggleActivity.variables?.id : undefined}
            maxHeight={480}
          />
        </Card>
      )}
    </>
  );

  // ─── Sección Gastos Pendientes ───────────────────────────────
  const pendingSection = <PendingExpenses expenses={monthlyExpenses} accounts={activeAccounts} />;

  // ─── Sección Esta semana (tareas + eventos, próximos 7 días) ──
  const weekSection = <WeekAhead tasks={tasks} events={weekEvents} />;

  return (
    <ScreenContainer onRefresh={onRefresh} refreshing={false} maxContentWidth={isWide ? 960 : 600}>
      {/* ─── Header ───────────────────────────────────────────── */}
      <PageHeader />

      {/* ─── Hero + Meta destacada (apiladas, ancho completo) ─── */}
      <HeroCard pct={pct} done={done} total={total} longestStreak={longestStreak} />
      {featuredGoal && <FeaturedGoalCard goal={featuredGoal} />}

      {/* ─── Quick stats ──────────────────────────────────────── */}
      <View style={styles.statsRow}>
        <StatCard value={String(pendingTasks.length)} label="Tareas hoy" />
        <StatCard
          value={
            financeStats ? formatCompactBalance(financeStats.balance, financeStats.currency) : '—'
          }
          label="Saldo total"
          accent
        />
        <StatCard value={String(recurringCount)} label="Por pagar" />
      </View>

      {/* ─── Agenda ‖ Gastos (2 col en tablet); Esta semana abajo a ancho completo ─── */}
      {isWide ? (
        <>
          <View style={styles.twoCol}>
            <View style={styles.col}>{agendaSection}</View>
            <View style={styles.col}>{pendingSection}</View>
          </View>
          {weekSection}
        </>
      ) : (
        <>
          {agendaSection}
          {pendingSection}
          {weekSection}
        </>
      )}
    </ScreenContainer>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  headerDate: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.muted,
    marginBottom: 2,
  },
  headerGreeting: {
    fontFamily: 'Inter_700Bold',
    fontSize: 26,
    color: Colors.ink,
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  bellBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.line,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    color: '#fff',
  },

  // Hero
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius['3xl'],
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.lg,
    ...Shadows.nav,
  },
  heroInfo: { flex: 1 },
  heroSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
    marginBottom: 4,
  },
  heroMain: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: '#fff',
    lineHeight: 24,
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  heroStreak: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },

  // Responsive 2-column (tablet)
  twoCol: {
    flexDirection: 'row',
    gap: Spacing.lg,
    alignItems: 'flex-start',
  },
  col: { flex: 1 },

  // Quick stats
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surfaceSolid,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.line,
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    ...Shadows.account,
  },
  statValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: Colors.ink,
    letterSpacing: -0.5,
    marginBottom: 3,
  },
  statLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: Colors.muted,
  },

  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: Colors.ink,
    letterSpacing: -0.2,
  },

  // Agenda header with quick links
  agendaHeader: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    gap: 6,
  },
  agendaLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  agendaLink: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: Colors.vivid,
  },
  agendaSep: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.muted,
  },

  // Featured goal
  featuredGoal: {
    backgroundColor: '#FFFBEB',
    borderRadius: Radius['2xl'],
    borderWidth: 1,
    borderColor: '#FCD34D',
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.account,
  },
  featuredGoalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  featuredGoalLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: '#D97706',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  featuredGoalPct: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: '#D97706',
  },
  featuredGoalTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: Colors.ink,
    letterSpacing: -0.3,
    marginBottom: 10,
  },
  featuredGoalBar: {
    height: 6,
    backgroundColor: '#FEF3C7',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  featuredGoalFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 3,
  },
  featuredGoalMeta: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  featuredGoalMetaText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.muted,
  },
});
