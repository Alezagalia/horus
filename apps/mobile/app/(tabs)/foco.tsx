import { useState, useCallback, useEffect } from 'react';
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
import { CheckCircle2, Circle, Trash2, Pencil } from 'lucide-react-native';
import { format, isToday, isPast, isTomorrow, parseISO, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { HabitFormModal } from '@/components/habits/HabitFormModal';
import { NumericHabitSheet } from '@/components/habits/NumericHabitSheet';
import { Colors, Typography, Spacing, Radius, Shadows, Gradients } from '@/tokens';
import {
  useHabits,
  useHabitStats,
  useToggleHabitComplete,
  useDeleteHabit,
  habitKeys,
} from '@/hooks/useHabits';
import {
  useTasks,
  useToggleTaskComplete,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useTaskCategories,
  taskKeys,
} from '@/hooks/useTasks';
import {
  useGoals,
  useCreateGoal,
  useUpdateGoal,
  useDeleteGoal,
  useFeatureGoal,
  goalKeys,
} from '@/hooks/useGoals';
import { useHabitMoments } from '@/hooks/useHabitMoments';
import type { Habit } from '@/services/api/habitApi';
import type { Task, CreateTaskDTO } from '@/services/api/taskApi';
import type { GoalWithProgress, CreateGoalDTO, UpdateGoalDTO, GoalPriority } from '@horus/shared';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router, useLocalSearchParams } from 'expo-router';
import { apiErrorMessage } from '@/lib/apiError';

// ─── constants ────────────────────────────────────────────────────────────────

// TIME_ORDER y TIME_LABELS son ahora dinámicos desde la API (useHabitMoments)

const PRIORITY_OPTIONS: Array<{ value: 'alta' | 'media' | 'baja'; label: string }> = [
  { value: 'alta', label: 'Alta' },
  { value: 'media', label: 'Media' },
  { value: 'baja', label: 'Baja' },
];

// ─── helpers ──────────────────────────────────────────────────────────────────

function isHabitDueToday(h: Habit): boolean {
  if (!h.isActive) return false;
  const dow = new Date().getDay();
  // Espejo de la validación del backend: MONTHLY siempre; WEEKLY exige weekDays;
  // DAILY/CUSTOM respetan weekDays si están configurados (si no, todos los días).
  if (h.periodicity === 'MONTHLY') return true;
  if (h.periodicity === 'WEEKLY') return h.weekDays.includes(dow);
  if (h.weekDays.length > 0) return h.weekDays.includes(dow);
  return true;
}

// Estado real del día desde el registro (no desde lastCompletedDate, que el
// backend no limpia al desmarcar). Requiere pedir los hábitos con ?date=.
function isCompletedToday(h: Habit): boolean {
  return h.records?.[0]?.completed === true;
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

function groupByTimeOfDay(
  habits: Habit[],
  momentOrder: string[],
  momentLabels: Record<string, string>,
  momentEmojis: Record<string, string>
): Array<{ key: string; label: string; emoji: string; habits: Habit[] }> {
  const map: Record<string, Habit[]> = {};
  for (const h of habits) {
    const key = h.timeOfDay ?? 'ANYTIME';
    (map[key] ??= []).push(h);
  }
  // Mantener el orden de los momentos de la API; claves no encontradas al final
  const knownKeys = momentOrder.filter((k) => map[k]?.length);
  const unknownKeys = Object.keys(map).filter((k) => !momentOrder.includes(k) && map[k]?.length);
  return [...knownKeys, ...unknownKeys].map((k) => ({
    key: k,
    label: momentLabels[k] ?? k,
    emoji: momentEmojis[k] ?? '⏰',
    habits: map[k],
  }));
}

// ─── Habit row (grouped) ──────────────────────────────────────────────────────

function HabitRow({
  habit,
  onToggle,
  onEdit,
  onDelete,
  toggling,
  isLast,
}: {
  habit: Habit;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  toggling: boolean;
  isLast?: boolean;
}) {
  const done = isCompletedToday(habit);
  const icon = habit.category?.icon ?? '·';

  return (
    <View style={[styles.habitRow, !isLast && styles.rowDivider]}>
      <TouchableOpacity
        onPress={onToggle}
        disabled={toggling}
        activeOpacity={0.65}
        hitSlop={6}
        style={styles.habitCheckWrap}
      >
        {toggling ? (
          <ActivityIndicator size="small" color={Colors.vivid} style={styles.habitCheck} />
        ) : (
          <View style={[styles.habitCheck, done && styles.habitCheckDone]}>
            {done && <View style={styles.habitCheckInner} />}
          </View>
        )}
      </TouchableOpacity>
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
      <TouchableOpacity onPress={onEdit} hitSlop={8} style={styles.habitActionBtn}>
        <Pencil size={14} color={Colors.muted} strokeWidth={1.5} />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() =>
          Alert.alert('Eliminar', `¿Eliminar "${habit.name}"?`, [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Eliminar', style: 'destructive', onPress: onDelete },
          ])
        }
        hitSlop={8}
        style={styles.habitActionBtn}
      >
        <Trash2 size={14} color={Colors.muted} strokeWidth={1.5} />
      </TouchableOpacity>
    </View>
  );
}

// ─── Task card (individual) ───────────────────────────────────────────────────

function TaskCard({
  task,
  onToggle,
  onEdit,
  onDelete,
  toggling,
}: {
  task: Task;
  onToggle: () => void;
  onEdit: () => void;
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

      {/* Priority dot + edit + delete */}
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
        <TouchableOpacity onPress={onEdit} hitSlop={8} style={styles.deleteBtn}>
          <Pencil size={14} color={Colors.muted} strokeWidth={1.5} />
        </TouchableOpacity>
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

function GoalListItem({
  goal,
  onEdit,
  onDelete,
  onFeature,
}: {
  goal: GoalWithProgress;
  onEdit: () => void;
  onDelete: () => void;
  onFeature: () => void;
}) {
  // progress ya viene en escala 0–100 desde el backend (no multiplicar por 100).
  const pct = Math.round(goal.progress ?? 0);
  const priorityColor =
    goal.priority === 'alta' ? '#EF4444' : goal.priority === 'media' ? '#F97316' : Colors.muted;

  return (
    <TouchableOpacity
      onPress={() => router.push({ pathname: '/meta-detalle', params: { id: goal.id } })}
      activeOpacity={0.85}
    >
      <Card solid style={[styles.goalListItem, goal.isFeatured && styles.goalListItemFeatured]}>
        <View style={styles.goalListTop}>
          <View style={[styles.goalPriorityBar, { backgroundColor: priorityColor }]} />
          <Text style={styles.goalListTitle} numberOfLines={2}>
            {goal.title}
          </Text>
          <Text style={styles.goalListPct}>{pct}%</Text>
          {/* Star / feature button */}
          <TouchableOpacity onPress={onFeature} hitSlop={8} style={styles.deleteBtn}>
            <Text style={{ fontSize: 14, color: goal.isFeatured ? '#F59E0B' : Colors.muted }}>
              {goal.isFeatured ? '★' : '☆'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onEdit} hitSlop={8} style={styles.deleteBtn}>
            <Pencil size={14} color={Colors.muted} strokeWidth={1.5} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() =>
              Alert.alert('Eliminar', `¿Eliminar "${goal.title}"?`, [
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
        <View style={styles.goalBar}>
          <View style={[styles.goalBarFill, { width: `${pct}%` }]} />
        </View>
        {goal.targetDate && (
          <Text style={styles.goalMeta}>
            Quedan {Math.max(0, differenceInDays(parseISO(goal.targetDate), new Date()))} días
          </Text>
        )}
      </Card>
    </TouchableOpacity>
  );
}

// ─── Habit view ───────────────────────────────────────────────────────────────

function HabitView({
  habits,
  stats,
  momentOrder,
  momentLabels,
  momentEmojis,
  onToggle,
  onEdit,
  onDelete,
  onNew,
  toggling,
}: {
  habits: Habit[];
  stats: { today: { total: number; completed: number; percentage: number } } | undefined;
  momentOrder: string[];
  momentLabels: Record<string, string>;
  momentEmojis: Record<string, string>;
  onToggle: (h: Habit) => void;
  onEdit: (h: Habit) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
  toggling: (id: string) => boolean;
}) {
  const pct = stats?.today.percentage ?? 0;
  const done = stats?.today.completed ?? 0;
  const total = stats?.today.total ?? 0;
  const groups = groupByTimeOfDay(habits, momentOrder, momentLabels, momentEmojis);

  return (
    <>
      {/* Stats mini bar + new button */}
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
        <TouchableOpacity onPress={onNew} activeOpacity={0.7}>
          <Text style={styles.sectionLink}>+ Nuevo</Text>
        </TouchableOpacity>
      </View>

      {groups.length === 0 ? (
        <Card solid style={styles.emptyCard}>
          <Text style={styles.emptyText}>No hay hábitos para hoy 🎉</Text>
        </Card>
      ) : (
        groups.map((group) => (
          <View key={group.key} style={styles.group}>
            <Text style={styles.groupLabel}>
              {group.emoji} {group.label.toUpperCase()}
            </Text>
            <Card padding={0} solid>
              {group.habits.map((h, i) => (
                <HabitRow
                  key={h.id}
                  habit={h}
                  onToggle={() => onToggle(h)}
                  onEdit={() => onEdit(h)}
                  onDelete={() => onDelete(h.id)}
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

function TaskFormModal({
  visible,
  onClose,
  task,
}: {
  visible: boolean;
  onClose: () => void;
  task?: Task;
}) {
  const isEdit = !!task;

  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<'alta' | 'media' | 'baja' | null>(null);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [categoryId, setCategoryId] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const { data: categories = [] } = useTaskCategories();

  // Pre-load when editing
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setPriority(task.priority ?? null);
      setDueDate(task.dueDate ? new Date(task.dueDate) : null);
      setCategoryId(task.categoryId ?? '');
    }
  }, [task]);

  const reset = () => {
    setTitle('');
    setPriority(null);
    setDueDate(null);
    setCategoryId('');
    setShowDatePicker(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const dto: CreateTaskDTO = {
      title: trimmed,
      ...(priority ? { priority } : {}),
      ...(dueDate ? { dueDate: dueDate.toISOString() } : {}),
      ...(categoryId ? { categoryId } : {}),
    };
    if (isEdit && task) {
      updateTask.mutate(
        { id: task.id, dto },
        {
          onSuccess: handleClose,
          onError: () => Alert.alert('Error', 'No se pudo actualizar la tarea'),
        }
      );
    } else {
      createTask.mutate(dto, {
        onSuccess: handleClose,
        onError: () => Alert.alert('Error', 'No se pudo crear la tarea'),
      });
    }
  };

  const isPending = createTask.isPending || updateTask.isPending;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={styles.overlay} onPress={handleClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>{isEdit ? 'Editar tarea' : 'Nueva tarea'}</Text>

          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="¿Qué hay que hacer?"
            placeholderTextColor={Colors.muted}
            autoFocus={!isEdit}
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
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

          {/* Due date */}
          <Text style={styles.priorityLabel}>Fecha límite</Text>
          <View style={styles.dueDateRow}>
            <TouchableOpacity
              style={[styles.dueDateBtn, dueDate && styles.dueDateBtnActive]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={[styles.dueDateBtnLabel, dueDate && styles.dueDateBtnLabelActive]}>
                {dueDate ? format(dueDate, "d 'de' MMMM", { locale: es }) : 'Sin fecha'}
              </Text>
            </TouchableOpacity>
            {dueDate && (
              <TouchableOpacity
                onPress={() => setDueDate(null)}
                hitSlop={8}
                style={styles.dueDateClear}
              >
                <Text style={styles.dueDateClearLabel}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Categories */}
          {categories.length > 0 && (
            <>
              <Text style={styles.priorityLabel}>Categoría</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[styles.priorityChips, { marginBottom: Spacing.xl }]}
              >
                <Chip
                  label="Sin categoría"
                  active={!categoryId}
                  onPress={() => setCategoryId('')}
                />
                {categories.map((cat) => (
                  <Chip
                    key={cat.id}
                    label={`${cat.icon ?? ''} ${cat.name}`.trim()}
                    active={categoryId === cat.id}
                    onPress={() => setCategoryId(cat.id)}
                  />
                ))}
              </ScrollView>
            </>
          )}

          <Button
            label={isEdit ? 'Guardar' : 'Crear tarea'}
            onPress={handleSubmit}
            loading={isPending}
            disabled={!title.trim() || isPending}
            style={styles.createTaskBtn}
          />
        </View>
      </KeyboardAvoidingView>

      {showDatePicker && (
        <DateTimePicker
          value={dueDate ?? new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          minimumDate={new Date()}
          onChange={(_event, date) => {
            if (Platform.OS === 'android') setShowDatePicker(false);
            if (date) setDueDate(date);
          }}
        />
      )}
    </Modal>
  );
}

// ─── screen ───────────────────────────────────────────────────────────────────

type Tab = 'tareas' | 'habitos' | 'metas';

export default function FocoScreen() {
  const { tab } = useLocalSearchParams<{ tab?: Tab }>();
  const [activeTab, setActiveTab] = useState<Tab>('tareas');

  useEffect(() => {
    if (tab === 'habitos' || tab === 'tareas' || tab === 'metas') {
      setActiveTab(tab);
    }
  }, [tab]);
  const [taskStatusFilter, setTaskStatusFilter] = useState<
    'pendiente' | 'en_progreso' | 'completada' | 'todas'
  >('pendiente');
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [showHabitModal, setShowHabitModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | undefined>(undefined);
  const [numericHabit, setNumericHabit] = useState<Habit | null>(null);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<GoalWithProgress | undefined>(undefined);
  const queryClient = useQueryClient();

  // Fresco en cada render (no a nivel de módulo) para no congelarse al minimizar.
  const TODAY = format(new Date(), 'yyyy-MM-dd');

  const { data: habits = [], isLoading: hLoading } = useHabits(TODAY);
  const { data: stats } = useHabitStats();
  const { data: tasks = [], isLoading: tLoading } = useTasks();
  const { data: goals = [], isLoading: gLoading } = useGoals('en_progreso');
  const { data: moments = [] } = useHabitMoments();
  const featureGoal = useFeatureGoal();

  const momentOrder = moments.map((m) => m.key);
  const momentLabels = Object.fromEntries(moments.map((m) => [m.key, m.label]));
  const momentEmojis = Object.fromEntries(moments.map((m) => [m.key, m.emoji]));

  const toggleHabit = useToggleHabitComplete();
  const deleteHabit = useDeleteHabit();
  const toggleTask = useToggleTaskComplete();
  const deleteTask = useDeleteTask();
  const deleteGoal = useDeleteGoal();

  const todayHabits = habits.filter(isHabitDueToday);
  const pendingCount = tasks.filter((t) => t.status === 'pendiente').length;

  const filteredTasks =
    taskStatusFilter === 'todas' ? tasks : tasks.filter((t) => t.status === taskStatusFilter);

  const tasksByCategory = filteredTasks.reduce<
    Record<string, { label: string; color?: string; icon?: string; tasks: Task[] }>
  >((acc, task) => {
    const key = task.categoryId ?? '__none__';
    if (!acc[key]) {
      acc[key] = {
        label: task.categoryName ?? 'Sin categoría',
        color: task.categoryColor,
        icon: task.categoryIcon,
        tasks: [],
      };
    }
    acc[key].tasks.push(task);
    return acc;
  }, {});

  const categoryEntries = Object.entries(tasksByCategory).sort(([a], [b]) =>
    a === '__none__' ? 1 : b === '__none__' ? -1 : 0
  );

  const onRefresh = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: habitKeys.all }),
      queryClient.invalidateQueries({ queryKey: taskKeys.all }),
      queryClient.invalidateQueries({ queryKey: goalKeys.all }),
      queryClient.invalidateQueries({ queryKey: goalKeys.featured }),
    ]);
  }, [queryClient]);

  const handleToggleHabit = (habit: Habit) => {
    const done = isCompletedToday(habit);
    // For NUMERIC uncompleted habits → open value sheet
    if (habit.type === 'NUMERIC' && !done) {
      setNumericHabit(habit);
      return;
    }
    toggleHabit.mutate(
      { habitId: habit.id, date: TODAY, completed: !done },
      {
        onError: (err) =>
          Alert.alert('Error', apiErrorMessage(err, 'No se pudo actualizar el hábito')),
      }
    );
  };

  const handleEditHabit = (habit: Habit) => {
    setEditingHabit(habit);
    setShowHabitModal(true);
  };

  const handleDeleteHabit = (id: string) => {
    deleteHabit.mutate(id, {
      onError: () => Alert.alert('Error', 'No se pudo eliminar el hábito'),
    });
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

  const handleEditGoal = (goal: GoalWithProgress) => {
    setEditingGoal(goal);
    setShowGoalModal(true);
  };

  const handleDeleteGoal = (id: string) => {
    deleteGoal.mutate(id, {
      onError: () => Alert.alert('Error', 'No se pudo eliminar la meta'),
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
            badge={pendingCount || undefined}
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
            {/* Header */}
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Tareas</Text>
              <TouchableOpacity onPress={() => setShowCreateTask(true)} activeOpacity={0.7}>
                <Text style={styles.sectionLink}>+ Nueva</Text>
              </TouchableOpacity>
            </View>

            {/* Status filter chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.taskFilterScroll}
              contentContainerStyle={styles.taskFilterChips}
            >
              {(
                [
                  { key: 'pendiente', label: 'Pendiente' },
                  { key: 'en_progreso', label: 'En progreso' },
                  { key: 'completada', label: 'Completada' },
                  { key: 'todas', label: 'Todas' },
                ] as const
              ).map(({ key, label }) => (
                <Chip
                  key={key}
                  label={label}
                  active={taskStatusFilter === key}
                  onPress={() => setTaskStatusFilter(key)}
                />
              ))}
            </ScrollView>

            {/* Grouped by category */}
            {filteredTasks.length === 0 ? (
              <Card solid style={styles.emptyCard}>
                <Text style={styles.emptyText}>Sin tareas 🎯</Text>
              </Card>
            ) : (
              categoryEntries.map(([key, group]) => (
                <View key={key} style={styles.categorySection}>
                  <View style={styles.categoryHeader}>
                    {group.icon ? <Text style={styles.categoryIcon}>{group.icon}</Text> : null}
                    <Text style={styles.categoryLabel}>{group.label}</Text>
                    <Text style={styles.categoryCount}>{group.tasks.length}</Text>
                  </View>
                  <View style={styles.taskList}>
                    {group.tasks.map((t) => (
                      <TaskCard
                        key={t.id}
                        task={t}
                        onToggle={() => handleToggleTask(t)}
                        onEdit={() => {
                          setEditingTask(t);
                          setShowCreateTask(true);
                        }}
                        onDelete={() => handleDeleteTask(t.id)}
                        toggling={
                          (toggleTask.isPending && toggleTask.variables === t.id) ||
                          (deleteTask.isPending && deleteTask.variables === t.id)
                        }
                      />
                    ))}
                  </View>
                </View>
              ))
            )}
          </>
        ) : // ─── HÁBITOS ──────────────────────────────────────
        activeTab === 'habitos' ? (
          <HabitView
            habits={todayHabits}
            stats={stats}
            momentOrder={momentOrder}
            momentLabels={momentLabels}
            momentEmojis={momentEmojis}
            onToggle={handleToggleHabit}
            onEdit={handleEditHabit}
            onDelete={handleDeleteHabit}
            onNew={() => {
              setEditingHabit(undefined);
              setShowHabitModal(true);
            }}
            toggling={(id) => toggleHabit.isPending && toggleHabit.variables?.habitId === id}
          />
        ) : (
          // ─── METAS ────────────────────────────────────────
          <>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Metas activas</Text>
              <TouchableOpacity
                onPress={() => {
                  setEditingGoal(undefined);
                  setShowGoalModal(true);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.sectionLink}>+ Nueva</Text>
              </TouchableOpacity>
            </View>
            {goals.length === 0 ? (
              <Card solid style={styles.emptyCard}>
                <Text style={styles.emptyText}>No hay metas activas</Text>
              </Card>
            ) : (
              <View style={styles.taskList}>
                {goals.map((g) => (
                  <GoalListItem
                    key={g.id}
                    goal={g}
                    onEdit={() => handleEditGoal(g)}
                    onDelete={() => handleDeleteGoal(g.id)}
                    onFeature={() => featureGoal.mutate(g.id)}
                  />
                ))}
              </View>
            )}
          </>
        )}
      </ScreenContainer>

      <TaskFormModal
        visible={showCreateTask}
        onClose={() => {
          setShowCreateTask(false);
          setEditingTask(undefined);
        }}
        task={editingTask}
      />
      <HabitFormModal
        visible={showHabitModal}
        onClose={() => {
          setShowHabitModal(false);
          setEditingHabit(undefined);
        }}
        habit={editingHabit}
      />
      <NumericHabitSheet habit={numericHabit} onClose={() => setNumericHabit(null)} />
      <GoalFormModal
        visible={showGoalModal}
        onClose={() => {
          setShowGoalModal(false);
          setEditingGoal(undefined);
        }}
        goal={editingGoal}
      />
    </>
  );
}

// ─── Goal form modal ──────────────────────────────────────────────────────────

function GoalFormModal({
  visible,
  onClose,
  goal,
}: {
  visible: boolean;
  onClose: () => void;
  goal?: GoalWithProgress;
}) {
  const isEdit = !!goal;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<GoalPriority>('media');
  const [targetDate, setTargetDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const isBusy = createGoal.isPending || updateGoal.isPending;

  useEffect(() => {
    if (visible) {
      if (goal) {
        setTitle(goal.title);
        setDescription(goal.description ?? '');
        setPriority(goal.priority);
        setTargetDate(goal.targetDate ? parseISO(goal.targetDate) : null);
      } else {
        setTitle('');
        setDescription('');
        setPriority('media');
        setTargetDate(null);
      }
    }
  }, [visible, goal]);

  const handleSubmit = () => {
    const trimmed = title.trim();
    if (!trimmed) {
      Alert.alert('Error', 'El nombre de la meta es requerido');
      return;
    }
    const dto: CreateGoalDTO & UpdateGoalDTO = {
      title: trimmed,
      description: description.trim() || undefined,
      priority,
      targetDate: targetDate ? format(targetDate, 'yyyy-MM-dd') : undefined,
    };
    if (isEdit) {
      updateGoal.mutate(
        { id: goal.id, dto },
        {
          onSuccess: onClose,
          onError: () => Alert.alert('Error', 'No se pudo actualizar la meta'),
        }
      );
    } else {
      createGoal.mutate(dto as CreateGoalDTO, {
        onSuccess: onClose,
        onError: () => Alert.alert('Error', 'No se pudo crear la meta'),
      });
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.sheet}
      >
        <View style={styles.sheetHandle} />
        <Text style={styles.sheetTitle}>{isEdit ? 'Editar meta' : 'Nueva meta'}</Text>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Title */}
          <Text style={styles.priorityLabel}>Nombre *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Ej. Correr 5km seguidos"
            placeholderTextColor={Colors.muted}
            autoFocus
            returnKeyType="next"
          />

          {/* Description */}
          <Text style={styles.priorityLabel}>Descripción</Text>
          <TextInput
            style={[styles.input, { minHeight: 64, textAlignVertical: 'top' }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Opcional"
            placeholderTextColor={Colors.muted}
            multiline
            returnKeyType="default"
          />

          {/* Priority */}
          <Text style={styles.priorityLabel}>Prioridad</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.priorityChips}
          >
            {PRIORITY_OPTIONS.map((opt) => (
              <Chip
                key={opt.value}
                label={opt.label}
                active={priority === opt.value}
                onPress={() => setPriority(opt.value)}
              />
            ))}
          </ScrollView>

          {/* Target date */}
          <Text style={styles.priorityLabel}>Fecha objetivo</Text>
          <View style={styles.dueDateRow}>
            <TouchableOpacity
              style={[styles.dueDateBtn, targetDate && styles.dueDateBtnActive]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={[styles.dueDateBtnLabel, targetDate && styles.dueDateBtnLabelActive]}>
                {targetDate ? format(targetDate, "d 'de' MMMM yyyy", { locale: es }) : 'Sin fecha'}
              </Text>
            </TouchableOpacity>
            {targetDate && (
              <TouchableOpacity onPress={() => setTargetDate(null)} style={styles.dueDateClear}>
                <Text style={styles.dueDateClearLabel}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          {showDatePicker && (
            <DateTimePicker
              value={targetDate ?? new Date()}
              mode="date"
              minimumDate={new Date()}
              onChange={(_e, date) => {
                setShowDatePicker(false);
                if (date) setTargetDate(date);
              }}
            />
          )}

          <Button
            label={isEdit ? 'Guardar' : 'Crear meta'}
            onPress={handleSubmit}
            loading={isBusy}
            disabled={isBusy}
            style={{ marginTop: Spacing.xl, marginBottom: Spacing.lg }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
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

  // Task status filter
  taskFilterScroll: { marginBottom: Spacing.md },
  taskFilterChips: { gap: Spacing.xs, paddingRight: Spacing.sm },

  // Category grouping
  categorySection: { marginBottom: Spacing.lg },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.sm,
  },
  categoryIcon: { fontSize: 14 },
  categoryLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: Colors.muted,
    letterSpacing: 0.4,
    flex: 1,
    textTransform: 'uppercase',
  },
  categoryCount: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: Colors.muted,
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
  habitCheckWrap: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
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
  habitActionBtn: {
    padding: 4,
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
  goalListItemFeatured: { borderColor: '#FCD34D', borderWidth: 1.5 },
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
  dueDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  dueDateBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    borderColor: Colors.line,
    backgroundColor: Colors.ice,
  },
  dueDateBtnActive: {
    borderColor: Colors.vivid,
    backgroundColor: Colors.ice,
  },
  dueDateBtnLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: Colors.muted,
  },
  dueDateBtnLabelActive: {
    color: Colors.vivid,
    fontFamily: 'Inter_600SemiBold',
  },
  dueDateClear: {
    padding: 4,
  },
  dueDateClearLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.muted,
  },
  createTaskBtn: {},
});
