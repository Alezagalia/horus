import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Dumbbell,
  Play,
  Clock,
  BarChart2,
  Zap,
  ChevronRight,
  Trophy,
  Trash2,
} from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Colors, Spacing, Radius, Gradients, Shadows, Typography } from '@/tokens';
import {
  useRoutines,
  useWorkoutHistory,
  useStartWorkout,
  useFinishWorkout,
  useCancelWorkout,
  useAddSet,
  useDeleteSet,
  workoutKeys,
} from '@/hooks/useWorkouts';
import type {
  Routine,
  WorkoutSummaryItem,
  StartedWorkout,
  WorkoutSet,
  WorkoutExercise,
} from '@/services/api/workoutApi';

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatVolume(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)}t`;
  return `${Math.round(kg)} kg`;
}

function formatRelative(dateStr: string): string {
  return formatDistanceToNow(parseISO(dateStr), { addSuffix: true, locale: es });
}

function formatWorkoutDate(dateStr: string): string {
  return format(parseISO(dateStr), "d MMM · HH'h'mm", { locale: es });
}

// ─── sub-components ───────────────────────────────────────────────────────────

function StatsBar({ totalWorkouts, totalVolume }: { totalWorkouts: number; totalVolume: number }) {
  return (
    <LinearGradient
      colors={Gradients.nudge}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.statsBar}
    >
      <View style={styles.statItem}>
        <Dumbbell size={16} color={Colors.vividLight} strokeWidth={1.5} />
        <Text style={styles.statValue}>{totalWorkouts}</Text>
        <Text style={styles.statLabel}>entrenamientos</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Zap size={16} color={Colors.vividLight} strokeWidth={1.5} />
        <Text style={styles.statValue}>{formatVolume(totalVolume)}</Text>
        <Text style={styles.statLabel}>volumen total</Text>
      </View>
    </LinearGradient>
  );
}

function RoutineCard({
  routine,
  onStart,
  starting,
}: {
  routine: Routine;
  onStart: () => void;
  starting: boolean;
}) {
  return (
    <Card solid style={styles.routineCard}>
      <View style={styles.routineTop}>
        <View style={styles.routineIconWrap}>
          <Dumbbell size={20} color={Colors.vivid} strokeWidth={1.5} />
        </View>
        <View style={styles.routineInfo}>
          <Text style={styles.routineName} numberOfLines={1}>
            {routine.name}
          </Text>
          {routine.description ? (
            <Text style={styles.routineDesc} numberOfLines={1}>
              {routine.description}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.routineMeta}>
        <View style={styles.metaChip}>
          <BarChart2 size={12} color={Colors.muted} strokeWidth={1.5} />
          <Text style={styles.metaText}>{routine.exerciseCount} ejercicios</Text>
        </View>
        <View style={styles.metaChip}>
          <Trophy size={12} color={Colors.muted} strokeWidth={1.5} />
          <Text style={styles.metaText}>{routine.timesExecuted}× completada</Text>
        </View>
        {routine.lastExecuted && (
          <View style={styles.metaChip}>
            <Clock size={12} color={Colors.muted} strokeWidth={1.5} />
            <Text style={styles.metaText}>{formatRelative(routine.lastExecuted)}</Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[styles.startBtn, starting && styles.startBtnDisabled]}
        onPress={onStart}
        disabled={starting}
        activeOpacity={0.85}
      >
        {starting ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Play size={14} color="#fff" strokeWidth={2} fill="#fff" />
            <Text style={styles.startBtnLabel}>Comenzar</Text>
          </>
        )}
      </TouchableOpacity>
    </Card>
  );
}

function WorkoutHistoryRow({ workout, isLast }: { workout: WorkoutSummaryItem; isLast?: boolean }) {
  return (
    <View style={[styles.historyRow, !isLast && styles.historyRowBorder]}>
      <View style={styles.historyLeft}>
        <Text style={styles.historyName} numberOfLines={1}>
          {workout.routineName ?? 'Sin rutina'}
        </Text>
        <Text style={styles.historyDate}>{formatWorkoutDate(workout.startTime)}</Text>
      </View>
      <View style={styles.historyStats}>
        <Text style={styles.historyStatVal}>{formatDuration(workout.duration)}</Text>
        <Text style={styles.historyStatSub}>duración</Text>
      </View>
      <View style={styles.historyStats}>
        <Text style={styles.historyStatVal}>{workout.totalSets}</Text>
        <Text style={styles.historyStatSub}>series</Text>
      </View>
      {workout.totalVolume > 0 && (
        <View style={styles.historyStats}>
          <Text style={styles.historyStatVal}>{formatVolume(workout.totalVolume)}</Text>
          <Text style={styles.historyStatSub}>volumen</Text>
        </View>
      )}
    </View>
  );
}

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

// ─── views ────────────────────────────────────────────────────────────────────

function RoutinesView({ onStarted }: { onStarted: (w: StartedWorkout) => void }) {
  const { data: routines = [], isLoading } = useRoutines();
  const startWorkout = useStartWorkout();

  const handleStart = (routine: Routine) => {
    Alert.alert('Comenzar entrenamiento', `¿Iniciar "${routine.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Comenzar',
        onPress: () =>
          startWorkout.mutate(routine.id, {
            onSuccess: (data) => onStarted(data),
            onError: (err: any) => {
              const msg = err?.response?.data?.message ?? 'No se pudo iniciar el entrenamiento';
              Alert.alert('Error', msg);
            },
          }),
      },
    ]);
  };

  if (isLoading) {
    return <ActivityIndicator color={Colors.vivid} style={{ marginVertical: 32 }} />;
  }

  if (routines.length === 0) {
    return (
      <Card solid style={styles.emptyCard}>
        <Dumbbell size={32} color={Colors.ceilLight} strokeWidth={1} />
        <Text style={styles.emptyTitle}>Sin rutinas</Text>
        <Text style={styles.emptySub}>Creá una rutina desde la web para verla aquí</Text>
      </Card>
    );
  }

  return (
    <>
      {routines.map((r) => (
        <RoutineCard
          key={r.id}
          routine={r}
          onStart={() => handleStart(r)}
          starting={startWorkout.isPending && startWorkout.variables === r.id}
        />
      ))}
    </>
  );
}

function HistorialView() {
  const { data, isLoading } = useWorkoutHistory({ limit: 20 });
  const workouts = data?.workouts ?? [];
  const total = data?.pagination.total ?? 0;

  // Aggregate stats for the stats bar
  const totalVolume = workouts.reduce((sum, w) => sum + w.totalVolume, 0);

  if (isLoading) {
    return <ActivityIndicator color={Colors.vivid} style={{ marginVertical: 32 }} />;
  }

  return (
    <>
      {total > 0 && <StatsBar totalWorkouts={total} totalVolume={totalVolume} />}

      <SectionHeader title="ENTRENAMIENTOS RECIENTES" count={workouts.length} />

      {workouts.length === 0 ? (
        <Card solid style={styles.emptyCard}>
          <Trophy size={32} color={Colors.ceilLight} strokeWidth={1} />
          <Text style={styles.emptyTitle}>Sin entrenamientos</Text>
          <Text style={styles.emptySub}>Completá tu primer entrenamiento para verlo aquí</Text>
        </Card>
      ) : (
        <Card padding={0} solid>
          {workouts.map((w, i) => (
            <WorkoutHistoryRow
              key={w.id}
              workout={w}
              isLast={i === workouts.length - 1 && total <= workouts.length}
            />
          ))}
          {total > workouts.length && (
            <View style={styles.moreRow}>
              <ChevronRight size={14} color={Colors.muted} />
              <Text style={styles.moreText}>{total - workouts.length} más en la web</Text>
            </View>
          )}
        </Card>
      )}
    </>
  );
}

// ─── Active workout modal ─────────────────────────────────────────────────────

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function ActiveWorkoutModal({
  workout,
  routineName,
  onFinish,
  onCancel,
}: {
  workout: StartedWorkout;
  routineName: string;
  onFinish: () => void;
  onCancel: () => void;
}) {
  const [elapsed, setElapsed] = useState(0);
  const [sets, setSets] = useState<Record<string, WorkoutSet[]>>(() =>
    Object.fromEntries(workout.exercises.map((ex) => [ex.workoutExerciseId, ex.sets]))
  );
  const [inputs, setInputs] = useState<Record<string, { reps: string; weight: string }>>(() =>
    Object.fromEntries(
      workout.exercises.map((ex) => [ex.workoutExerciseId, { reps: '', weight: '' }])
    )
  );

  const addSet = useAddSet();
  const deleteSet = useDeleteSet();
  const finishWorkout = useFinishWorkout();
  const cancelWorkout = useCancelWorkout();

  useEffect(() => {
    const interval = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const updateInput = (weId: string, field: 'reps' | 'weight', value: string) => {
    setInputs((prev) => ({ ...prev, [weId]: { ...prev[weId], [field]: value } }));
  };

  const handleAddSet = (ex: WorkoutExercise) => {
    const inp = inputs[ex.workoutExerciseId];
    const reps = parseInt(inp.reps, 10);
    const weight = parseFloat(inp.weight);
    if (!inp.reps || isNaN(reps) || reps <= 0) {
      Alert.alert('Error', 'Ingresá las repeticiones');
      return;
    }
    addSet.mutate(
      {
        workoutId: workout.workout.id,
        workoutExerciseId: ex.workoutExerciseId,
        dto: { reps, weight: isNaN(weight) ? 0 : weight },
      },
      {
        onSuccess: (newSet) => {
          setSets((prev) => ({
            ...prev,
            [ex.workoutExerciseId]: [...(prev[ex.workoutExerciseId] ?? []), newSet],
          }));
        },
        onError: () => Alert.alert('Error', 'No se pudo registrar la serie'),
      }
    );
  };

  const handleDeleteSet = (weId: string, setId: string) => {
    deleteSet.mutate(
      { workoutId: workout.workout.id, workoutExerciseId: weId, setId },
      {
        onSuccess: () => {
          setSets((prev) => ({
            ...prev,
            [weId]: prev[weId].filter((s) => s.id !== setId),
          }));
        },
        onError: () => Alert.alert('Error', 'No se pudo eliminar la serie'),
      }
    );
  };

  const handleFinish = () => {
    const totalSets = Object.values(sets).reduce((sum, s) => sum + s.length, 0);
    Alert.alert(
      'Finalizar entrenamiento',
      `Registraste ${totalSets} serie${totalSets !== 1 ? 's' : ''}. ¿Finalizar?`,
      [
        { text: 'Seguir', style: 'cancel' },
        {
          text: 'Finalizar',
          onPress: () =>
            finishWorkout.mutate(workout.workout.id, {
              onSuccess: onFinish,
              onError: () => Alert.alert('Error', 'No se pudo finalizar el entrenamiento'),
            }),
        },
      ]
    );
  };

  const handleCancel = () => {
    Alert.alert('Cancelar entrenamiento', '¿Cancelar? Se perderán las series registradas.', [
      { text: 'Continuar', style: 'cancel' },
      {
        text: 'Cancelar entrenamiento',
        style: 'destructive',
        onPress: () =>
          cancelWorkout.mutate(workout.workout.id, {
            onSuccess: onCancel,
            onError: () => Alert.alert('Error', 'No se pudo cancelar el entrenamiento'),
          }),
      },
    ]);
  };

  const totalSetsLogged = Object.values(sets).reduce((sum, s) => sum + s.length, 0);
  const isBusy = finishWorkout.isPending || cancelWorkout.isPending;

  return (
    <Modal visible animationType="slide" onRequestClose={handleCancel}>
      <View style={awStyles.container}>
        {/* ─── Header ── */}
        <View style={awStyles.header}>
          <TouchableOpacity onPress={handleCancel} disabled={isBusy} style={awStyles.headerSideBtn}>
            <Text style={awStyles.cancelLabel}>Cancelar</Text>
          </TouchableOpacity>

          <View style={awStyles.headerCenter}>
            <Text style={awStyles.headerTitle} numberOfLines={1}>
              {routineName}
            </Text>
            <Text style={awStyles.timerLabel}>{formatElapsed(elapsed)}</Text>
          </View>

          <TouchableOpacity
            onPress={handleFinish}
            disabled={isBusy}
            style={[awStyles.headerSideBtn, awStyles.finishBtn]}
          >
            {finishWorkout.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={awStyles.finishLabel}>Finalizar</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* ─── Stats strip ── */}
        <View style={awStyles.strip}>
          <Text style={awStyles.stripText}>
            {workout.exercises.length} ejercicios · {totalSetsLogged} serie
            {totalSetsLogged !== 1 ? 's' : ''} registrada{totalSetsLogged !== 1 ? 's' : ''}
          </Text>
        </View>

        {/* ─── Exercises ── */}
        <ScrollView
          style={awStyles.scroll}
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {workout.exercises.map((ex) => {
            const exSets = sets[ex.workoutExerciseId] ?? [];
            const inp = inputs[ex.workoutExerciseId] ?? { reps: '', weight: '' };
            const isAdding =
              addSet.isPending &&
              (addSet.variables as any)?.workoutExerciseId === ex.workoutExerciseId;

            return (
              <View key={ex.workoutExerciseId} style={awStyles.exerciseCard}>
                {/* Exercise title row */}
                <View style={awStyles.exHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={awStyles.exName}>{ex.exerciseName}</Text>
                    <Text style={awStyles.exMeta}>
                      {ex.muscleGroup}
                      {ex.targetSets
                        ? `  ·  ${ex.targetSets}×${ex.targetReps ?? '?'}${ex.targetWeight ? ` @ ${ex.targetWeight}kg` : ''}`
                        : ''}
                    </Text>
                  </View>
                  <View style={awStyles.setCounter}>
                    <Text style={awStyles.setCountNum}>{exSets.length}</Text>
                    {ex.targetSets != null && (
                      <Text style={awStyles.setCountDen}>/{ex.targetSets}</Text>
                    )}
                  </View>
                </View>

                {/* Logged sets table */}
                {exSets.length > 0 && (
                  <View style={awStyles.setTable}>
                    <View style={awStyles.setTableHead}>
                      <Text style={[awStyles.setHeadCell, { flex: 0.4 }]}>#</Text>
                      <Text style={awStyles.setHeadCell}>REPS</Text>
                      <Text style={awStyles.setHeadCell}>KG</Text>
                      <View style={{ width: 24 }} />
                    </View>
                    {exSets.map((set) => (
                      <View key={set.id} style={awStyles.setTableRow}>
                        <Text style={[awStyles.setCell, { flex: 0.4, color: Colors.muted }]}>
                          {set.setNumber}
                        </Text>
                        <Text style={awStyles.setCell}>{set.reps}</Text>
                        <Text style={awStyles.setCell}>{set.weight}</Text>
                        <TouchableOpacity
                          onPress={() => handleDeleteSet(ex.workoutExerciseId, set.id)}
                          hitSlop={8}
                          disabled={deleteSet.isPending}
                        >
                          <Trash2 size={14} color={Colors.muted} strokeWidth={1.5} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}

                {/* Add set row */}
                <View style={awStyles.addRow}>
                  <TextInput
                    style={awStyles.setInput}
                    value={inp.reps}
                    onChangeText={(v) => updateInput(ex.workoutExerciseId, 'reps', v)}
                    placeholder={ex.targetReps != null ? String(ex.targetReps) : 'Reps'}
                    placeholderTextColor={Colors.muted}
                    keyboardType="numeric"
                    returnKeyType="next"
                  />
                  <TextInput
                    style={awStyles.setInput}
                    value={inp.weight}
                    onChangeText={(v) => updateInput(ex.workoutExerciseId, 'weight', v)}
                    placeholder={ex.targetWeight != null ? String(ex.targetWeight) : 'Kg'}
                    placeholderTextColor={Colors.muted}
                    keyboardType="numeric"
                    returnKeyType="done"
                    onSubmitEditing={() => handleAddSet(ex)}
                  />
                  <TouchableOpacity
                    style={[awStyles.addBtn, isAdding && { opacity: 0.6 }]}
                    onPress={() => handleAddSet(ex)}
                    disabled={isAdding}
                  >
                    {isAdding ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={awStyles.addBtnLabel}>+ Serie</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── screen ───────────────────────────────────────────────────────────────────

type Tab = 'rutinas' | 'historial';

export default function CuerpoScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('rutinas');
  const [activeWorkout, setActiveWorkout] = useState<StartedWorkout | null>(null);
  const queryClient = useQueryClient();

  const { data: routines = [] } = useRoutines();
  const { data: historyData } = useWorkoutHistory({ limit: 20 });
  const workoutCount = historyData?.pagination.total ?? 0;

  const onRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: workoutKeys.all });
  }, [queryClient]);

  const handleWorkoutFinished = useCallback(() => {
    setActiveWorkout(null);
    queryClient.invalidateQueries({ queryKey: workoutKeys.all });
  }, [queryClient]);

  const activeRoutineName =
    routines.find((r) => r.id === activeWorkout?.workout.routineId)?.name ?? 'Entrenamiento';

  return (
    <>
      <ScreenContainer onRefresh={onRefresh} refreshing={false}>
        {/* Page header */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Cuerpo</Text>
          <Text style={styles.pageSubtitle}>Tu progreso físico</Text>
        </View>

        {/* Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabScroll}
          contentContainerStyle={styles.tabRow}
        >
          <Chip
            label="Rutinas"
            active={activeTab === 'rutinas'}
            badge={routines.length > 0 ? routines.length : undefined}
            onPress={() => setActiveTab('rutinas')}
          />
          <Chip
            label="Historial"
            active={activeTab === 'historial'}
            badge={workoutCount > 0 ? workoutCount : undefined}
            onPress={() => setActiveTab('historial')}
          />
        </ScrollView>

        {activeTab === 'rutinas' ? (
          <RoutinesView onStarted={setActiveWorkout} />
        ) : (
          <HistorialView />
        )}
      </ScreenContainer>

      {activeWorkout && (
        <ActiveWorkoutModal
          workout={activeWorkout}
          routineName={activeRoutineName}
          onFinish={handleWorkoutFinished}
          onCancel={() => setActiveWorkout(null)}
        />
      )}
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
  tabScroll: { marginBottom: Spacing.xl },
  tabRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingRight: Spacing.screenX,
  },

  // Stats bar
  statsBar: {
    flexDirection: 'row',
    borderRadius: Radius['2xl'],
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    ...Shadows.nav,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    color: '#fff',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginHorizontal: Spacing.md,
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

  // Routine card
  routineCard: {
    marginBottom: Spacing.md,
  },
  routineTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  routineIconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.lg,
    backgroundColor: Colors.ice,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routineInfo: { flex: 1 },
  routineName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: Colors.ink,
  },
  routineDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.muted,
    marginTop: 2,
  },
  routineMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.bgTop,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  metaText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: Colors.muted,
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.vivid,
    borderRadius: Radius.pill,
    paddingVertical: 11,
    ...Shadows.cta,
  },
  startBtnDisabled: { opacity: 0.6 },
  startBtnLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: '#fff',
  },

  // History row
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 13,
    gap: Spacing.sm,
  },
  historyRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  historyLeft: { flex: 1 },
  historyName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.ink,
  },
  historyDate: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: Colors.muted,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  historyStats: {
    alignItems: 'center',
    minWidth: 48,
  },
  historyStatVal: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    color: Colors.ink,
  },
  historyStatSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: Colors.muted,
    marginTop: 1,
  },
  moreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 12,
  },
  moreText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: Colors.muted,
  },

  // Empty state
  emptyCard: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing['2xl'],
  },
  emptyTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: Colors.ink,
    marginTop: Spacing.sm,
  },
  emptySub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.muted,
    textAlign: 'center',
  },
});

// ─── Active workout styles ─────────────────────────────────────────────────────

const awStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgTop,
    paddingTop: Platform.OS === 'android' ? 28 : 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  headerSideBtn: {
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: Radius.pill,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: Colors.ink,
    letterSpacing: -0.3,
  },
  timerLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: Colors.vivid,
    marginTop: 2,
  },
  cancelLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: Colors.muted,
  },
  finishBtn: {
    backgroundColor: Colors.vivid,
  },
  finishLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: '#fff',
  },
  strip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    backgroundColor: Colors.ice,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  stripText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: Colors.muted,
    textAlign: 'center',
  },
  scroll: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  exerciseCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.line,
    backgroundColor: '#fff',
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.nav,
  },
  exHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  exName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: Colors.ink,
    letterSpacing: -0.2,
  },
  exMeta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.muted,
    marginTop: 2,
  },
  setCounter: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 1,
  },
  setCountNum: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: Colors.vivid,
    letterSpacing: -0.5,
  },
  setCountDen: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: Colors.muted,
  },
  setTable: {
    borderRadius: Radius.lg,
    backgroundColor: Colors.bgTop,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  setTableHead: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  setHeadCell: {
    flex: 1,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    color: Colors.muted,
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  setTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  setCell: {
    flex: 1,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: Colors.ink,
    textAlign: 'center',
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  setInput: {
    flex: 1,
    height: 44,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.line,
    backgroundColor: Colors.bgTop,
    textAlign: 'center',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.ink,
  },
  addBtn: {
    height: 44,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.vivid,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.cta,
  },
  addBtnLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    color: '#fff',
  },
});
