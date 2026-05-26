import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Dumbbell, Play, Clock, BarChart2, Zap, ChevronRight, Trophy } from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Colors, Spacing, Radius, Gradients, Shadows, Typography } from '@/tokens';
import { useRoutines, useWorkoutHistory, useStartWorkout, workoutKeys } from '@/hooks/useWorkouts';
import type { Routine, WorkoutSummaryItem } from '@/services/api/workoutApi';

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

function RoutinesView() {
  const { data: routines = [], isLoading } = useRoutines();
  const startWorkout = useStartWorkout();

  const handleStart = (routine: Routine) => {
    Alert.alert('Comenzar entrenamiento', `¿Iniciar "${routine.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Comenzar',
        onPress: () =>
          startWorkout.mutate(routine.id, {
            onSuccess: () =>
              Alert.alert(
                '¡Listo! 💪',
                'Entrenamiento iniciado. Registrá tus series en la web o cuando termines marcalo como completado.'
              ),
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

// ─── screen ───────────────────────────────────────────────────────────────────

type Tab = 'rutinas' | 'historial';

export default function CuerpoScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('rutinas');
  const queryClient = useQueryClient();

  const { data: routines = [] } = useRoutines();
  const { data: historyData } = useWorkoutHistory({ limit: 20 });
  const workoutCount = historyData?.pagination.total ?? 0;

  const onRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: workoutKeys.all });
  }, [queryClient]);

  return (
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

      {activeTab === 'rutinas' ? <RoutinesView /> : <HistorialView />}
    </ScreenContainer>
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
