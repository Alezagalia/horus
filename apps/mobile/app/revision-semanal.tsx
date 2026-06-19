import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  format,
  startOfWeek,
  addWeeks,
  subWeeks,
  endOfWeek,
  parseISO,
  differenceInDays,
} from 'date-fns';
import { es } from 'date-fns/locale';
import {
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  Target,
  TrendingUp,
} from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Colors, Spacing, Radius, Gradients, Shadows } from '@/tokens';
import {
  useWeeklyStats,
  useCurrentReview,
  useReviewQuestions,
  useCreateReview,
  useUpdateReview,
} from '@/hooks/useWeeklyReview';
import { useGoals } from '@/hooks/useGoals';
import { useTasks } from '@/hooks/useTasks';

function getMonday(d: Date) {
  return startOfWeek(d, { weekStartsOn: 1 });
}

function fmt(d: Date, f: string) {
  return format(d, f, { locale: es });
}

// ─── stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent: string;
}) {
  return (
    <View style={[styles.statCard, { borderTopColor: accent }]}>
      <Text style={[styles.statValue, { color: accent }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statSub}>{sub}</Text>
    </View>
  );
}

// ─── focus item ───────────────────────────────────────────────────────────────

function FocusItem({
  label,
  selected,
  onPress,
  disabled,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={disabled ? 1 : 0.7}
      style={[styles.focusItem, selected && styles.focusItemOn]}
    >
      {selected ? (
        <CheckCircle2 size={18} color={Colors.vivid} strokeWidth={2} />
      ) : (
        <Circle size={18} color={Colors.muted} strokeWidth={1.5} />
      )}
      <Text style={[styles.focusLabel, selected && styles.focusLabelOn]} numberOfLines={2}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── main screen ──────────────────────────────────────────────────────────────

export default function RevisionSemanalScreen() {
  const [weekRef, setWeekRef] = useState(() => getMonday(new Date()));
  const weekStart = format(weekRef, 'yyyy-MM-dd');
  const weekEnd = endOfWeek(weekRef, { weekStartsOn: 1 });
  const isCurrentWeek = weekRef.getTime() >= getMonday(new Date()).getTime();

  const { data: stats, isLoading: loadingStats } = useWeeklyStats(weekStart);
  // El balance financiero pasó a desglosarse por moneda; tomamos ARS (o la primera disponible).
  const financeBalance =
    stats?.finance.byCurrency.find((c) => c.currency === 'ARS')?.balance ??
    stats?.finance.byCurrency[0]?.balance ??
    0;
  const { data: review } = useCurrentReview(weekStart);
  const { data: questions = [] } = useReviewQuestions();
  const { data: goals = [] } = useGoals('en_progreso');
  const { data: pendingTasks = [] } = useTasks({ status: 'pendiente' });

  const createReview = useCreateReview();
  const updateReview = useUpdateReview();

  // local answers (override from server once user edits)
  const [localAnswers, setLocalAnswers] = useState<Record<string, string>>({});
  const [localGoalIds, setLocalGoalIds] = useState<Set<string> | null>(null);
  const [localTaskIds, setLocalTaskIds] = useState<Set<string> | null>(null);
  const [saving, setSaving] = useState(false);

  // merge server + local
  const serverAnswers: Record<string, string> = {};
  if (review) {
    for (const a of review.answers) serverAnswers[a.questionId] = a.answer;
  }
  const answers = { ...serverAnswers, ...localAnswers };
  const goalIds = localGoalIds ?? new Set(review?.focusGoals.map((f) => f.goalId) ?? []);
  const taskIds = localTaskIds ?? new Set(review?.focusTasks.map((f) => f.taskId) ?? []);

  const isCompleted = !!review?.completedAt;

  const toggleGoal = (id: string) => {
    if (isCompleted) return;
    setLocalGoalIds((prev) => {
      const base = new Set(prev ?? goalIds);
      if (base.has(id)) base.delete(id);
      else base.add(id);
      return base;
    });
  };

  const toggleTask = (id: string) => {
    if (isCompleted) return;
    setLocalTaskIds((prev) => {
      const base = new Set(prev ?? taskIds);
      if (base.has(id)) base.delete(id);
      else base.add(id);
      return base;
    });
  };

  const handleSave = useCallback(
    async (complete: boolean) => {
      setSaving(true);
      try {
        const dto = {
          answers: Object.entries(answers).map(([questionId, answer]) => ({ questionId, answer })),
          focusGoalIds: [...goalIds],
          focusTaskIds: [...taskIds],
          completedAt: complete ? new Date().toISOString() : undefined,
        };
        let reviewId = review?.id;
        if (!reviewId) {
          const created = await createReview.mutateAsync({ weekStart });
          reviewId = created.id;
        }
        await updateReview.mutateAsync({ id: reviewId, dto, weekStart });
        if (complete) Alert.alert('¡Completada!', 'Tu revisión semanal fue guardada.');
      } catch {
        Alert.alert('Error', 'No se pudo guardar la revisión.');
      } finally {
        setSaving(false);
      }
    },
    [review, answers, goalIds, taskIds, weekStart]
  );

  const activeQuestions = questions.filter((q) => q.isActive).sort((a, b) => a.order - b.order);

  return (
    <View style={styles.root}>
      {/* Header */}
      <LinearGradient colors={Gradients.hero} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <X size={22} color="#fff" strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Revisión Semanal</Text>
          <View style={{ width: 22 }} />
        </View>

        <View style={styles.weekRow}>
          <TouchableOpacity onPress={() => setWeekRef((w) => subWeeks(w, 1))} hitSlop={8}>
            <ChevronLeft size={20} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
          <View style={styles.weekCenter}>
            <Text style={styles.weekText}>
              {fmt(weekRef, 'd MMM')} — {fmt(weekEnd, 'd MMM yyyy')}
            </Text>
            {isCompleted && (
              <View style={styles.doneBadge}>
                <CheckCircle2 size={11} color="#22c55e" />
                <Text style={styles.doneText}>Completada</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            onPress={() =>
              setWeekRef((w) => {
                const next = addWeeks(w, 1);
                return next <= getMonday(new Date()) ? next : w;
              })
            }
            hitSlop={8}
            disabled={isCurrentWeek}
          >
            <ChevronRight
              size={20}
              color={isCurrentWeek ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.8)'}
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Stats */}
        {loadingStats ? (
          <ActivityIndicator color={Colors.vivid} style={{ marginVertical: Spacing.xl }} />
        ) : stats ? (
          <>
            <Text style={styles.section}>Resumen de la semana</Text>
            <View style={styles.statsGrid}>
              <StatCard
                label="Hábitos"
                value={`${Math.round(stats.habits.rate * 100)}%`}
                sub={`${stats.habits.completed}/${stats.habits.total}`}
                accent="#6366f1"
              />
              <StatCard
                label="Tareas"
                value={String(stats.tasks.completed)}
                sub="completadas"
                accent="#22c55e"
              />
              <StatCard
                label="Balance"
                value={
                  financeBalance >= 0
                    ? `+${(financeBalance / 1000).toFixed(0)}k`
                    : `${(financeBalance / 1000).toFixed(0)}k`
                }
                sub="ARS"
                accent={financeBalance >= 0 ? '#10b981' : '#ef4444'}
              />
              <StatCard
                label="Eventos"
                value={String(stats.events.completed)}
                sub={`de ${stats.events.total}`}
                accent="#f59e0b"
              />
            </View>

            {stats.goals.length > 0 && (
              <>
                <Text style={styles.section}>Progreso de metas</Text>
                {stats.goals.map((g) => {
                  const pct = Math.round(g.progress * 100);
                  return (
                    <Card solid key={g.id} style={styles.goalRow}>
                      <View style={styles.goalRowHead}>
                        <Target size={13} color={Colors.vivid} />
                        <Text style={styles.goalRowTitle} numberOfLines={1}>
                          {g.title}
                        </Text>
                        <Text style={styles.goalRowPct}>{pct}%</Text>
                      </View>
                      <View style={styles.bar}>
                        <View style={[styles.barFill, { width: `${pct}%` }]} />
                      </View>
                    </Card>
                  );
                })}
              </>
            )}
          </>
        ) : null}

        {/* Reflection */}
        {activeQuestions.length > 0 && (
          <>
            <Text style={styles.section}>Reflexión</Text>
            {activeQuestions.map((q) => (
              <Card solid key={q.id} style={styles.qCard}>
                <Text style={styles.qText}>{q.text}</Text>
                <TextInput
                  value={answers[q.id] ?? ''}
                  onChangeText={(v) => setLocalAnswers((p) => ({ ...p, [q.id]: v }))}
                  placeholder="Escribe tu reflexión…"
                  placeholderTextColor={Colors.muted}
                  multiline
                  editable={!isCompleted}
                  style={styles.answerInput}
                />
              </Card>
            ))}
          </>
        )}

        {/* Focus — goals */}
        {goals.length > 0 && (
          <>
            <Text style={styles.section}>Enfoque próxima semana — Metas</Text>
            <Text style={styles.sectionSub}>
              Selecciona las metas en las que te vas a concentrar
            </Text>
            {goals.map((g) => (
              <FocusItem
                key={g.id}
                label={g.title}
                selected={goalIds.has(g.id)}
                onPress={() => toggleGoal(g.id)}
                disabled={isCompleted}
              />
            ))}
          </>
        )}

        {/* Focus — tasks */}
        {pendingTasks.length > 0 && (
          <>
            <Text style={[styles.section, { marginTop: Spacing.lg }]}>
              Enfoque próxima semana — Tareas
            </Text>
            <Text style={styles.sectionSub}>Tareas clave que querés completar</Text>
            {pendingTasks.slice(0, 10).map((t) => (
              <FocusItem
                key={t.id}
                label={t.title}
                selected={taskIds.has(t.id)}
                onPress={() => toggleTask(t.id)}
                disabled={isCompleted}
              />
            ))}
          </>
        )}

        {/* Actions */}
        {!isCompleted && (
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={() => handleSave(false)}
              disabled={saving}
              style={styles.draftBtn}
            >
              <Text style={styles.draftLabel}>Guardar borrador</Text>
            </TouchableOpacity>
            <Button label="Completar revisión" onPress={() => handleSave(true)} loading={saving} />
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgTop },

  // header
  header: { paddingTop: 56, paddingBottom: Spacing.lg, paddingHorizontal: Spacing.lg },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 18, color: '#fff' },
  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  weekCenter: { alignItems: 'center', gap: 6 },
  weekText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: '#fff',
    textTransform: 'capitalize',
  },
  doneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(34,197,94,0.18)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  doneText: { fontFamily: 'Inter_600SemiBold', fontSize: 11, color: '#22c55e' },

  // scroll
  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },

  // section
  section: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: Colors.ink,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  sectionSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.muted,
    marginBottom: Spacing.sm,
    marginTop: -Spacing.xs,
  },

  // stats grid
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  statCard: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: Colors.surfaceSolid,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    borderTopWidth: 3,
    ...Shadows.card,
  },
  statValue: { fontFamily: 'Inter_700Bold', fontSize: 22 },
  statLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: Colors.ink,
    marginTop: 2,
  },
  statSub: { fontFamily: 'Inter_400Regular', fontSize: 11, color: Colors.muted },

  // goal row
  goalRow: { marginBottom: Spacing.sm },
  goalRowHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 8,
  },
  goalRowTitle: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 13, color: Colors.ink },
  goalRowPct: { fontFamily: 'Inter_700Bold', fontSize: 13, color: Colors.vivid },
  bar: { height: 4, backgroundColor: Colors.line, borderRadius: 2 },
  barFill: { height: 4, backgroundColor: Colors.vivid, borderRadius: 2 },

  // questions
  qCard: { marginBottom: Spacing.sm },
  qText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.ink,
    marginBottom: Spacing.sm,
  },
  answerInput: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.ink,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radius.md,
    padding: Spacing.sm,
  },

  // focus items
  focusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: Colors.surfaceSolid,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.line,
    marginBottom: Spacing.sm,
  },
  focusItemOn: { borderColor: Colors.vivid, backgroundColor: Colors.vivid + '12' },
  focusLabel: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.ink },
  focusLabelOn: { fontFamily: 'Inter_500Medium', color: Colors.vivid },

  // actions
  actions: { marginTop: Spacing.xl, gap: Spacing.sm },
  draftBtn: {
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.line,
    alignItems: 'center',
    backgroundColor: Colors.surfaceSolid,
  },
  draftLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: Colors.ink },
});
