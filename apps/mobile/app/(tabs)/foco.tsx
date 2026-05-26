import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Circle, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react-native';
import { format, isToday, isPast, isTomorrow, parseISO, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { Colors, Typography, Spacing, Radius, Shadows, Gradients } from '@/tokens';
import { useHabits, useHabitStats, useToggleHabitComplete, habitKeys } from '@/hooks/useHabits';
import {
  useTasks,
  useToggleTaskComplete,
  useCreateTask,
  useDeleteTask,
  taskKeys,
} from '@/hooks/useTasks';
import { useGoals, goalKeys } from '@/hooks/useGoals';
import type { Habit } from '@/services/api/habitApi';
import type { Task, CreateTaskDTO } from '@/services/api/taskApi';
import type { GoalWithProgress } from '@horus/shared';
import { LinearGradient } from 'expo-linear-gradient';

// ─── constants ────────────────────────────────────────────────────────────────

const TODAY = format(new Date(), 'yyyy-MM-dd');

const TIME_ORDER = [
  'AYUNO',
  'MANANA',
  'MEDIA_MANANA',
  'TARDE',
  'MEDIA_TARDE',
  'NOCHE',
  'ANTES_DORMIR',
  'ANYTIME',
];

const TIME_LABELS: Record<string, string> = {
  AYUNO: 'En ayunas',
  MANANA: 'Mañana',
  MEDIA_MANANA: 'Media mañana',
  TARDE: 'Tarde',
  MEDIA_TARDE: 'Media tarde',
  NOCHE: 'Noche',
  ANTES_DORMIR: 'Antes de dormir',
  ANYTIME: 'Cualquier momento',
};

const PRIORITY_OPTIONS: Array<{ value: 'alta' | 'media' | 'baja'; label: string }> = [
  { value: 'alta', label: 'Alta' },
  { value: 'media', label: 'Media' },
  { value: 'baja', label: 'Baja' },
];

// ─── helpers ──────────────────────────────────────────────────────────────────

function isHabitDueToday(h: Habit): boolean {
  if (!h.isActive) return false;
  if (h.periodicity === 'DAILY') return true;
  if (h.periodicity === 'WEEKLY') return h.weekDays.includes(new Date().getDay());
  return true;
}

function isCompletedToday(h: Habit): boolean {
  return !!h.lastCompletedDate && h.lastCompletedDate.startsWith(TODAY);
}

function formatDueDate(dueDate?: string): string | null {
  if (!dueDate) return null;
  try {
    const d = parseISO(dueDate);
    if (isToday(d)) return 'Hoy';
    if (isTomorrow(d)) return 'Mañana';
    if (isPast(d)) return `Vencida · ${format(d, 'd MMM', { locale: es })}`;
    return format(d, 'EEE d', { locale: es });
  } catch {
    return null;
  }
}

function groupByTimeOfDay(habits: Habit[]): Array<{ key: string; label: string; habits: Habit[] }> {
  const map: Record<string, Habit[]> = {};
  for (const h of habits) {
    const key = h.timeOfDay ?? 'ANYTIME';
    (map[key] ??= []).push(h);
  }
  return TIME_ORDER.filter((k) => map[k]?.length).map((k) => ({
    key: k,
    label: TIME_LABELS[k] ?? k,
    habits: map[k],
  }));
}

// ─── Goal card ────────────────────────────────────────────────────────────────

function GoalCard({ goal }: { goal: GoalWithProgress }) {
  const pct = Math.round((goal.progress ?? 0) * 100);
  const krs = goal.keyResults ?? [];
  const krDone = krs.filter((kr) => kr.currentValue >= kr.targetValue).length;
  const daysLeft = goal.targetDate
    ? Math.max(0, differenceInDays(parseISO(goal.targetDate), new Date()))
    : null;

  return (
    <Card solid style={styles.goalCard}>
      <Text style={styles.goalOverline}>META ACTIVA</Text>
      <View style={styles.goalTopRow}>
        <Text style={styles.goalTitle} numberOfLines={2}>
          {goal.title}
        </Text>
        <Text style={styles.goalPct}>{pct}%</Text>
      </View>
      <View style={styles.goalBar}>
        <View style={[styles.goalBarFill, { width: `${pct}%` }]} />
      </View>
      <View style={styles.goalBottomRow}>
        {krs.length > 0 ? (
          <Text style={styles.goalMeta}>
            {krDone} de {krs.length} sub-metas
          </Text>
        ) : (
          <Text style={styles.goalMeta}>{goal.linkedTasksCount} tareas vinculadas</Text>
        )}
        {daysLeft !== null && <Text style={styles.goalMeta}>Quedan {daysLeft} días</Text>}
      </View>
    </Card>
  );
}

// ─── Habit row (grouped) ──────────────────────────────────────────────────────

function HabitRow({
  habit,
  onToggle,
  toggling,
  isLast,
}: {
  habit: Habit;
  onToggle: () => void;
  toggling: boolean;
  isLast?: boolean;
}) {
  const done = isCompletedToday(habit);
  const icon = habit.category?.icon ?? '·';

  return (
    <TouchableOpacity
      style={[styles.habitRow, !isLast && styles.rowDivider]}
      onPress={onToggle}
      disabled={toggling}
      activeOpacity={0.65}
    >
      {toggling ? (
        <ActivityIndicator size="small" color={Colors.vivid} style={styles.habitCheck} />
      ) : (
        <View style={[styles.habitCheck, done && styles.habitCheckDone]}>
          {done && <View style={styles.habitCheckInner} />}
        </View>
      )}
      <Text style={styles.habitIcon}>{icon}</Text>
      <Text style={[styles.habitName, done && styles.habitNameDone]} numberOfLines={1}>
        {habit.name}
      </Text>
      {habit.currentStreak > 0 && (
        <View style={styles.streakBadge}>
          <View style={styles.streakDot} />
          <Text style={styles.streakNum}>{habit.currentStreak}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Task card (individual) ───────────────────────────────────────────────────

function TaskCard({
  task,
  onToggle,
  onDelete,
  toggling,
}: {
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
  toggling: boolean;
}) {
  const done = task.status === 'completada';
  const dueLabel = formatDueDate(task.dueDate);
  const isOverdue = dueLabel?.startsWith('Vencida');
  const hasMeta = Boolean(dueLabel || task.categoryName);

  return (
    <View style={styles.taskCard}>
      {/* Checkbox */}
      <TouchableOpacity
        onPress={onToggle}
        disabled={toggling}
        hitSlop={10}
        style={styles.taskCheckWrap}
      >
        {toggling ? (
          <ActivityIndicator size="small" color={Colors.vivid} />
        ) : done ? (
          <CheckCircle2 size={26} color={Colors.vivid} strokeWidth={2} />
        ) : (
          <Circle size={26} color={Colors.line} strokeWidth={1.5} />
        )}
      </TouchableOpacity>

      {/* Content */}
      <View style={styles.taskCardContent}>
        <Text style={[styles.taskCardTitle, done && styles.taskDone]} numberOfLines={2}>
          {task.title}
        </Text>
        {hasMeta && (
          <View style={styles.taskMetaRow}>
            {dueLabel && (
              <Text style={[styles.taskMetaText, isOverdue && { color: '#EF4444' }]}>
                ⏰ {dueLabel}
              </Text>
            )}
            {dueLabel && task.categoryName && <Text style={styles.taskMetaText}> · </Text>}
            {task.categoryName && <Text style={styles.taskMetaText}>{task.categoryName}</Text>}
          </View>
        )}
      </View>

      {/* Priority dot + delete */}
      <View style={styles.taskRight}>
        <View
          style={[
            styles.taskPriorityDot,
            task.priority === 'alta'
              ? { backgroundColor: Colors.vivid }
              : task.priority === 'media'
                ? { backgroundColor: Colors.ceilDark, opacity: 0.6 }
                : { backgroundColor: Colors.muted, opacity: 0.3 },
          ]}
        />
        <TouchableOpacity
          onPress={() =>
            Alert.alert('Eliminar', `¿Eliminar "${task.title}"?`, [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Eliminar', style: 'destructive', onPress: onDelete },
            ])
          }
          hitSlop={8}
          style={styles.deleteBtn}
        >
          <Trash2 size={14} color={Colors.muted} strokeWidth={1.5} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Goal list item ───────────────────────────────────────────────────────────

function GoalListItem({ goal }: { goal: GoalWithProgress }) {
  const pct = Math.round((goal.progress ?? 0) * 100);
  const priorityColor =
    goal.priority === 'alta' ? '#EF4444' : goal.priority === 'media' ? '#F97316' : Colors.muted;

  return (
    <Card solid style={styles.goalListItem}>
      <View style={styles.goalListTop}>
        <View style={[styles.goalPriorityBar, { backgroundColor: priorityColor }]} />
        <Text style={styles.goalListTitle} numberOfLines={2}>
          {goal.title}
        </Text>
        <Text style={styles.goalListPct}>{pct}%</Text>
      </View>
      <View style={styles.goalBar}>
        <View style={[styles.goalBarFill, { width: `${pct}%` }]} />
      </View>
      {goal.targetDate && (
        <Text style={styles.goalMeta}>
          Quedan {Math.max(0, differenceInDays(parseISO(goal.targetDate), new Date()))} días
        </Text>
      )}
    </Card>
  );
}

// ─── Habit view ───────────────────────────────────────────────────────────────

function HabitView({
  habits,
  stats,
  onToggle,
  toggling,
}: {
  habits: Habit[];
  stats: { today: { total: number; completed: number; percentage: number } } | undefined;
  onToggle: (h: Habit) => void;
  toggling: (id: string) => boolean;
}) {
  const pct = stats?.today.percentage ?? 0;
  const done = stats?.today.completed ?? 0;
  const total = stats?.today.total ?? 0;
  const groups = groupByTimeOfDay(habits);

  return (
    <>
      {/* Stats mini bar */}
      <View style={styles.habitStats}>
        <ProgressRing progress={pct} size={52} strokeWidth={6} theme="dark" />
        <View style={{ flex: 1 }}>
          <Text style={styles.habitStatsMain}>
            {done === total && total > 0
              ? '¡Todos completados! 🎉'
              : `${done} de ${total} completados`}
          </Text>
          <Text style={styles.habitStatsSub}>
            {total > 0 ? `${Math.round(pct * 100)}% del día` : 'Empieza tu día'}
          </Text>
        </View>
      </View>

      {groups.length === 0 ? (
        <Card solid style={styles.emptyCard}>
          <Text style={styles.emptyText}>No hay hábitos para hoy 🎉</Text>
        </Card>
      ) : (
        groups.map((group) => (
          <View key={group.key} style={styles.group}>
            <Text style={styles.groupLabel}>{group.label.toUpperCase()}</Text>
            <Card padding={0} solid>
              {group.habits.map((h, i) => (
                <HabitRow
                  key={h.id}
                  habit={h}
                  onToggle={() => onToggle(h)}
                  toggling={toggling(h.id)}
                  isLast={i === group.habits.length - 1}
                />
              ))}
            </Card>
          </View>
        ))
      )}
    </>
  );
}

// ─── Task form modal ──────────────────────────────────────────────────────────

function TaskFormModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<'alta' | 'media' | 'baja' | null>(null);
  const createTask = useCreateTask();

  const handleCreate = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const dto: CreateTaskDTO = { title: trimmed, ...(priority ? { priority } : {}) };
    createTask.mutate(dto, {
      onSuccess: () => {
        setTitle('');
        setPriority(null);
        onClose();
      },
      onError: () => Alert.alert('Error', 'No se pudo crear la tarea'),
    });
  };

  const handleClose = () => {
    setTitle('');
    setPriority(null);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={styles.overlay} onPress={handleClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Nueva tarea</Text>

          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="¿Qué hay que hacer?"
            placeholderTextColor={Colors.muted}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleCreate}
          />

          <Text style={styles.priorityLabel}>Prioridad</Text>
          <View style={styles.priorityChips}>
            {PRIORITY_OPTIONS.map((p) => (
              <Chip
                key={p.value}
                label={p.label}
                active={priority === p.value}
                onPress={() => setPriority(priority === p.value ? null : p.value)}
              />
            ))}
          </View>

          <Button
            label="Crear tarea"
            onPress={handleCreate}
            loading={createTask.isPending}
            disabled={!title.trim()}
            style={styles.createTaskBtn}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── screen ───────────────────────────────────────────────────────────────────

type Tab = 'tareas' | 'habitos' | 'metas';

export default function FocoScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('tareas');
  const [showCreate, setShowCreate] = useState(false);
  const queryClient = useQueryClient();

  const { data: habits = [], isLoading: hLoading } = useHabits();
  const { data: stats } = useHabitStats();
  const { data: tasks = [], isLoading: tLoading } = useTasks();
  const { data: goals = [], isLoading: gLoading } = useGoals('en_progreso');

  const toggleHabit = useToggleHabitComplete();
  const toggleTask = useToggleTaskComplete();
  const deleteTask = useDeleteTask();

  const todayHabits = habits.filter(isHabitDueToday);
  const pendingTasks = tasks.filter((t) => t.status === 'pendiente' || t.status === 'en_progreso');
  const completedTasks = tasks.filter((t) => t.status === 'completada');

  // Featured goal: most progress or first active
  const featuredGoal =
    goals.length > 0 ? [...goals].sort((a, b) => (b.progress ?? 0) - (a.progress ?? 0))[0] : null;

  const onRefresh = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: habitKeys.all }),
      queryClient.invalidateQueries({ queryKey: taskKeys.all }),
      queryClient.invalidateQueries({ queryKey: goalKeys.all }),
    ]);
  }, [queryClient]);

  const handleToggleHabit = (habit: Habit) => {
    const done = isCompletedToday(habit);
    toggleHabit.mutate(
      { habitId: habit.id, date: TODAY, completed: !done },
      { onError: () => Alert.alert('Error', 'No se pudo actualizar el hábito') }
    );
  };

  const handleToggleTask = (task: Task) => {
    toggleTask.mutate(task.id, {
      onError: () => Alert.alert('Error', 'No se pudo actualizar la tarea'),
    });
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTask.mutate(taskId, {
      onError: () => Alert.alert('Error', 'No se pudo eliminar la tarea'),
    });
  };

  const isLoading =
    activeTab === 'habitos' ? hLoading : activeTab === 'metas' ? gLoading : tLoading;

  return (
    <>
      <ScreenContainer onRefresh={onRefresh} refreshing={false}>
        {/* ─── Page header ──────────────────────────────────── */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Foco</Text>
          <Text style={styles.pageSubtitle}>Lo que importa esta semana</Text>
        </View>

        {/* ─── Tab chips ────────────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabScroll}
          contentContainerStyle={styles.tabChips}
        >
          <Chip
            label="Tareas"
            active={activeTab === 'tareas'}
            badge={pendingTasks.length || undefined}
            onPress={() => setActiveTab('tareas')}
          />
          <Chip
            label="Hábitos"
            active={activeTab === 'habitos'}
            badge={todayHabits.filter((h) => !isCompletedToday(h)).length || undefined}
            onPress={() => setActiveTab('habitos')}
          />
          <Chip
            label="Metas"
            active={activeTab === 'metas'}
            badge={goals.length || undefined}
            onPress={() => setActiveTab('metas')}
          />
        </ScrollView>

        {isLoading ? (
          <ActivityIndicator color={Colors.vivid} style={{ marginTop: 40 }} />
        ) : // ─── TAREAS ───────────────────────────────────────
        activeTab === 'tareas' ? (
          <>
            {/* Featured goal */}
            {featuredGoal && <GoalCard goal={featuredGoal} />}

            {/* Por hacer header */}
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Por hacer</Text>
              <TouchableOpacity onPress={() => setShowCreate(true)} activeOpacity={0.7}>
                <Text style={styles.sectionLink}>+ Nueva</Text>
              </TouchableOpacity>
            </View>

            {/* Pending task cards */}
            {pendingTasks.length === 0 ? (
              <Card solid style={styles.emptyCard}>
                <Text style={styles.emptyText}>Sin tareas pendientes 🎯</Text>
              </Card>
            ) : (
              <View style={styles.taskList}>
                {pendingTasks.map((t) => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    onToggle={() => handleToggleTask(t)}
                    onDelete={() => handleDeleteTask(t.id)}
                    toggling={
                      (toggleTask.isPending && toggleTask.variables === t.id) ||
                      (deleteTask.isPending && deleteTask.variables === t.id)
                    }
                  />
                ))}
              </View>
            )}

            {/* Completed section */}
            {completedTasks.length > 0 && (
              <>
                <Text style={styles.completedLabel}>Completadas · {completedTasks.length}</Text>
                <View style={styles.taskList}>
                  {completedTasks.slice(0, 3).map((t) => (
                    <TaskCard
                      key={t.id}
                      task={t}
                      onToggle={() => handleToggleTask(t)}
                      onDelete={() => handleDeleteTask(t.id)}
                      toggling={toggleTask.isPending && toggleTask.variables === t.id}
                    />
                  ))}
                </View>
              </>
            )}
          </>
        ) : // ─── HÁBITOS ──────────────────────────────────────
        activeTab === 'habitos' ? (
          <HabitView
            habits={todayHabits}
            stats={stats}
            onToggle={handleToggleHabit}
            toggling={(id) => toggleHabit.isPending && toggleHabit.variables?.habitId === id}
          />
        ) : // ─── METAS ────────────────────────────────────────
        goals.length === 0 ? (
          <Card solid style={styles.emptyCard}>
            <Text style={styles.emptyText}>No hay metas activas</Text>
          </Card>
        ) : (
          <View style={styles.taskList}>
            {goals.map((g) => (
              <GoalListItem key={g.id} goal={g} />
            ))}
          </View>
        )}
      </ScreenContainer>

      <TaskFormModal visible={showCreate} onClose={() => setShowCreate(false)} />
    </>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Page header
  pageHeader: {
    marginBottom: Spacing.xl,
  },
  pageTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 30,
    color: Colors.ink,
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  pageSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.muted,
  },

  // Tabs
  tabScroll: { marginBottom: Spacing.lg },
  tabChips: { flexDirection: 'row', gap: Spacing.sm, paddingRight: Spacing.screenX },

  // Goal card
  goalCard: {
    marginBottom: Spacing.xl,
  },
  goalOverline: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    color: Colors.muted,
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  goalTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  goalTitle: {
    flex: 1,
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
    color: Colors.ink,
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  goalPct: {
    fontFamily: 'Inter_700Bold',
    fontSize: 26,
    color: Colors.vivid,
    letterSpacing: -0.5,
  },
  goalBar: {
    height: 6,
    backgroundColor: Colors.ice,
    borderRadius: 3,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  goalBarFill: {
    height: '100%',
    backgroundColor: Colors.vivid,
    borderRadius: 3,
  },
  goalBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  goalMeta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.muted,
  },

  // Section row (Por hacer)
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: Colors.ink,
    letterSpacing: -0.2,
  },
  sectionLink: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.vivid,
  },

  // Task list (individual cards)
  taskList: { gap: Spacing.sm, marginBottom: Spacing.lg },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSolid,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.line,
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    ...Shadows.account,
  },
  taskCheckWrap: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskCardContent: { flex: 1 },
  taskCardTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.ink,
    lineHeight: 19,
  },
  taskDone: {
    color: Colors.muted,
    textDecorationLine: 'line-through',
  },
  taskMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  taskMetaText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.muted,
  },
  taskRight: {
    alignItems: 'center',
    gap: 8,
  },
  taskPriorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  deleteBtn: {},

  // Completed label
  completedLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: Colors.muted,
    marginBottom: Spacing.sm,
    letterSpacing: 0.5,
  },

  // Habit rows
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 13,
    gap: Spacing.sm,
  },
  habitCheck: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.line,
    backgroundColor: Colors.ice,
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitCheckDone: {
    backgroundColor: Colors.black,
    borderColor: Colors.black,
  },
  habitCheckInner: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: '#fff',
  },
  habitIcon: { fontSize: 17, lineHeight: 21 },
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
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streakDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.vivid,
  },
  streakNum: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: Colors.vivid,
  },

  // Habit stats
  habitStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  habitStatsMain: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: Colors.deep,
    marginBottom: 3,
  },
  habitStatsSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.muted,
  },

  // Groups
  group: { marginBottom: Spacing.lg },
  groupLabel: {
    ...Typography.overline,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.muted,
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },

  // Goal list item
  goalListItem: { marginBottom: Spacing.sm },
  goalListTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  goalPriorityBar: {
    width: 4,
    borderRadius: 2,
    alignSelf: 'stretch',
    minHeight: 20,
  },
  goalListTitle: {
    flex: 1,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: Colors.ink,
    lineHeight: 20,
  },
  goalListPct: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: Colors.vivid,
  },

  // Empty
  emptyCard: {},
  emptyText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.muted,
    textAlign: 'center',
    paddingVertical: Spacing.sm,
  },

  // Modal
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10,14,31,0.4)',
  },
  modalContainer: {
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surfaceSolid,
    borderTopLeftRadius: Radius['3xl'],
    borderTopRightRadius: Radius['3xl'],
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: 40,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.line,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: Colors.ink,
    marginBottom: Spacing.lg,
  },
  input: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: Colors.ink,
    paddingVertical: Spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: Colors.vivid,
    marginBottom: Spacing.xl,
  },
  priorityLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: Colors.muted,
    marginBottom: Spacing.sm,
  },
  priorityChips: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  createTaskBtn: {},
});
