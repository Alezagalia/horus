import { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { format, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Bell, Check } from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Card } from '@/components/ui/Card';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { DailyTimeline } from '@/components/dashboard/DailyTimeline';
import { Colors, Spacing, Radius, Gradients, Shadows } from '@/tokens';
import { useAuthStore } from '@/store/authStore';
import { useHabits, useHabitStats, useToggleHabitComplete, habitKeys } from '@/hooks/useHabits';
import { useHabitMoments } from '@/hooks/useHabitMoments';
import { useTasks, useToggleTaskComplete, taskKeys } from '@/hooks/useTasks';
import { useFeaturedGoal, goalKeys } from '@/hooks/useGoals';
import { useFinanceStats, accountKeys } from '@/hooks/useAccounts';
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

const TODAY = format(new Date(), 'yyyy-MM-dd');
const TODAY_START = startOfDay(new Date()).toISOString();
const TODAY_END = endOfDay(new Date()).toISOString();

function isHabitDueToday(h: Habit): boolean {
  if (!h.isActive) return false;
  if (h.periodicity === 'DAILY') return true;
  if (h.periodicity === 'WEEKLY') return h.weekDays.includes(new Date().getDay());
  return true;
}

function isCompletedToday(h: Habit): boolean {
  return !!h.lastCompletedDate && h.lastCompletedDate.startsWith(TODAY);
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

// ─── SectionRow ───────────────────────────────────────────────────────────────

function SectionRow({
  title,
  linkLabel,
  onPress,
}: {
  title: string;
  linkLabel: string;
  onPress: () => void;
}) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <Text style={styles.sectionLink}>{linkLabel} →</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── TaskCheckRow ─────────────────────────────────────────────────────────────

function TaskCheckRow({
  task,
  onToggle,
  toggling,
  isLast,
}: {
  task: Task;
  onToggle: () => void;
  toggling: boolean;
  isLast?: boolean;
}) {
  const done = task.status === 'completada';
  const priorityColor =
    task.priority === 'alta' ? '#EF4444' : task.priority === 'media' ? '#F97316' : Colors.muted;

  return (
    <TouchableOpacity
      style={[styles.habitRow, !isLast && styles.rowDivider]}
      onPress={onToggle}
      disabled={toggling}
      activeOpacity={0.65}
    >
      {toggling ? (
        <ActivityIndicator size="small" color={Colors.vivid} style={styles.checkbox} />
      ) : done ? (
        <View style={[styles.checkbox, styles.checkboxDone]}>
          <Check size={13} color="#fff" strokeWidth={3} />
        </View>
      ) : (
        <View style={[styles.checkbox, { borderColor: priorityColor }]} />
      )}

      <Text style={styles.habitIcon}>
        {task.priority === 'alta' ? '🔴' : task.priority === 'media' ? '🟡' : '⚪'}
      </Text>

      <Text style={[styles.habitName, done && styles.habitNameDone]} numberOfLines={1}>
        {task.title}
      </Text>

      {task.categoryName && (
        <Text style={styles.taskCategory} numberOfLines={1}>
          {task.categoryName}
        </Text>
      )}
    </TouchableOpacity>
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

  const { data: habits = [], isLoading: habitsLoading } = useHabits();
  const { data: stats } = useHabitStats();
  const { data: habitMoments = [] } = useHabitMoments();
  const { data: tasks = [], isLoading: tasksLoading } = useTasks();
  const { data: featuredGoal } = useFeaturedGoal();
  const { data: financeStats } = useFinanceStats();
  const { data: recurringCount = 0 } = useRecurringExpensesCount();
  const { data: todayEvents = [] } = useCalendarEvents(TODAY_START, TODAY_END);
  const { data: todayActivities = [] } = useActivities(TODAY);

  const toggleHabit = useToggleHabitComplete();
  const toggleTask = useToggleTaskComplete();
  const toggleActivity = useToggleActivityRecord();

  const todayHabits = habits.filter(isHabitDueToday);
  const pendingTasks = tasks.filter(isPending).slice(0, 4);

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
    ]);
  }, [queryClient]);

  const handleToggleHabit = (habitId: string) => {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;
    const isDone = isCompletedToday(habit);
    toggleHabit.mutate(
      { habitId, date: TODAY, completed: !isDone },
      { onError: () => Alert.alert('Error', 'No se pudo actualizar el hábito') }
    );
  };

  const handleToggleTask = (task: Task) => {
    toggleTask.mutate(task.id, {
      onError: () => Alert.alert('Error', 'No se pudo actualizar la tarea'),
    });
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

  return (
    <ScreenContainer onRefresh={onRefresh} refreshing={false}>
      {/* ─── Header ───────────────────────────────────────────── */}
      <PageHeader />

      {/* ─── Hero ─────────────────────────────────────────────── */}
      <HeroCard pct={pct} done={done} total={total} longestStreak={longestStreak} />

      {/* ─── Featured Goal ────────────────────────────────────── */}
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

      {/* ─── Agenda del día ───────────────────────────────────── */}
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
          />
        </Card>
      )}

      {/* ─── Tareas ───────────────────────────────────────────── */}
      <SectionRow
        title="Tareas de hoy"
        linkLabel="Ver todas"
        onPress={() => router.push('/(tabs)/foco')}
      />

      {pendingTasks.length === 0 && !tasksLoading ? (
        <Card solid>
          <Text style={styles.emptyText}>No hay tareas pendientes 🎯</Text>
        </Card>
      ) : (
        <Card padding={0} solid>
          {pendingTasks.map((t, i) => (
            <TaskCheckRow
              key={t.id}
              task={t}
              onToggle={() => handleToggleTask(t)}
              toggling={toggleTask.isPending && toggleTask.variables === t.id}
              isLast={i === pendingTasks.length - 1}
            />
          ))}
        </Card>
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

  // Section row
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: Colors.ink,
    letterSpacing: -0.2,
  },
  sectionLink: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: Colors.vivid,
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

  // Task check row
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 13,
    gap: Spacing.sm,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: Colors.line,
    backgroundColor: Colors.ice,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: {
    backgroundColor: Colors.black,
    borderColor: Colors.black,
  },
  habitIcon: {
    fontSize: 18,
    lineHeight: 22,
  },
  habitName: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: Colors.ink,
  },
  habitNameDone: {
    color: Colors.muted,
    textDecorationLine: 'line-through',
  },

  // Task-specific
  taskCategory: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
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

  // Empty
  emptyText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.muted,
    textAlign: 'center',
    paddingVertical: Spacing.sm,
  },
});
