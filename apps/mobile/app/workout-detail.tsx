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
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ArrowLeft,
  Clock,
  Dumbbell,
  BarChart2,
  Zap,
  Trophy,
  TrendingUp,
  Star,
} from 'lucide-react-native';
import Constants from 'expo-constants';
import { useWorkoutDetail } from '@/hooks/useWorkouts';
import { Colors, Gradients, Spacing, Radius, Shadows, Typography } from '@/tokens';
import type { WorkoutExerciseDetailed } from '@/services/api/workoutApi';

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatDuration(minutes: number | null): string {
  if (!minutes) return '—';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatVolume(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)}t`;
  return `${kg} kg`;
}

function formatDate(iso: string): string {
  try {
    const d = parseISO(iso);
    return format(d, "EEEE d MMM · HH'h'mm", { locale: es });
  } catch {
    return iso;
  }
}

const MUSCLE_LABELS: Record<string, string> = {
  chest: 'Pecho',
  back: 'Espalda',
  shoulders: 'Hombros',
  arms: 'Brazos',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  legs: 'Piernas',
  glutes: 'Glúteos',
  core: 'Core',
  cardio: 'Cardio',
  full_body: 'Cuerpo entero',
};

function muscleLabel(group: string | null): string {
  if (!group) return '';
  return MUSCLE_LABELS[group.toLowerCase()] ?? group;
}

// ─── SummaryChip ──────────────────────────────────────────────────────────────

function SummaryChip({
  icon,
  value,
  label,
  accent,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  accent?: string;
}) {
  return (
    <View style={[dStyles.chip, accent ? { borderTopColor: accent, borderTopWidth: 3 } : null]}>
      {icon}
      <Text style={dStyles.chipValue}>{value}</Text>
      <Text style={dStyles.chipLabel}>{label}</Text>
    </View>
  );
}

// ─── ExerciseCard ─────────────────────────────────────────────────────────────

function ExerciseCard({ ex, index }: { ex: WorkoutExerciseDetailed; index: number }) {
  const completedSets = ex.sets.filter((s) => s.completed);
  const totalVol = completedSets.reduce((sum, s) => sum + s.reps * s.weight, 0);

  return (
    <View style={dStyles.exCard}>
      {/* Header */}
      <View style={dStyles.exHeader}>
        <View style={dStyles.exNum}>
          <Text style={dStyles.exNumText}>{index + 1}</Text>
        </View>
        <View style={dStyles.exInfo}>
          <Text style={dStyles.exName}>{ex.exerciseName}</Text>
          <View style={dStyles.exMeta}>
            {ex.muscleGroup && (
              <View style={dStyles.muscleBadge}>
                <Text style={dStyles.muscleBadgeText}>{muscleLabel(ex.muscleGroup)}</Text>
              </View>
            )}
            {ex.rpe != null && (
              <View style={dStyles.rpeBadge}>
                <Zap size={10} color="#F59E0B" />
                <Text style={dStyles.rpeText}>RPE {ex.rpe}</Text>
              </View>
            )}
            {totalVol > 0 && <Text style={dStyles.exVol}>{formatVolume(totalVol)}</Text>}
          </View>
        </View>
      </View>

      {/* Notes */}
      {ex.notes ? <Text style={dStyles.exNotes}>{ex.notes}</Text> : null}

      {/* Sets table */}
      {ex.sets.length > 0 && (
        <View style={dStyles.setsTable}>
          {/* Header row */}
          <View style={dStyles.setRowHead}>
            <Text style={[dStyles.setCell, dStyles.setCellNum]}>#</Text>
            <Text style={[dStyles.setCell, dStyles.setCellReps]}>Reps</Text>
            <Text style={[dStyles.setCell, dStyles.setCellWeight]}>Peso</Text>
            <Text style={[dStyles.setCell, dStyles.setCellStatus]}>✓</Text>
          </View>
          {ex.sets.map((s) => (
            <View key={s.setNumber} style={[dStyles.setRow, !s.completed && dStyles.setRowSkipped]}>
              <Text style={[dStyles.setCell, dStyles.setCellNum, dStyles.setVal]}>
                {s.setNumber}
              </Text>
              <Text style={[dStyles.setCell, dStyles.setCellReps, dStyles.setVal]}>{s.reps}</Text>
              <Text style={[dStyles.setCell, dStyles.setCellWeight, dStyles.setVal]}>
                {s.weight} {s.weightUnit}
              </Text>
              <Text
                style={[
                  dStyles.setCell,
                  dStyles.setCellStatus,
                  s.completed ? dStyles.setDone : dStyles.setSkipped,
                ]}
              >
                {s.completed ? '✓' : '—'}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── screen ───────────────────────────────────────────────────────────────────

export default function WorkoutDetailScreen() {
  const params = useLocalSearchParams<{ id: string; name?: string; startTime?: string }>();
  const workoutId = params.id ?? '';

  const { data, isLoading } = useWorkoutDetail(workoutId);

  const topInset = Constants.statusBarHeight ?? 44;

  const routineName = data?.routineName ?? params.name ?? 'Entrenamiento';
  const dateLabel = data?.startTime
    ? formatDate(data.startTime)
    : params.startTime
      ? formatDate(params.startTime)
      : '';
  const summary = data?.summary;
  const prs = summary?.personalRecords ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bgTop }}>
      {/* ─── Header ─────────────────────────────────────────────── */}
      <LinearGradient
        colors={Gradients.nudge}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[dStyles.header, { paddingTop: topInset + 12 }]}
      >
        <TouchableOpacity onPress={() => router.back()} style={dStyles.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={20} color="#fff" strokeWidth={2} />
        </TouchableOpacity>
        <View style={dStyles.headerCenter}>
          <Text style={dStyles.headerTitle} numberOfLines={1}>
            {routineName}
          </Text>
          {dateLabel ? <Text style={dStyles.headerSub}>{dateLabel}</Text> : null}
        </View>
        <View style={{ width: 36 }} />
      </LinearGradient>

      {isLoading ? (
        <ActivityIndicator color={Colors.vivid} style={{ marginTop: 48 }} />
      ) : !data ? (
        <View style={dStyles.emptyState}>
          <Dumbbell size={40} color={Colors.ceilLight} strokeWidth={1} />
          <Text style={dStyles.emptyText}>No se pudo cargar el detalle</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={dStyles.content} showsVerticalScrollIndicator={false}>
          {/* ─── Summary ──────────────────────────────────────── */}
          <Text style={dStyles.sectionTitle}>Resumen</Text>
          <View style={dStyles.chipRow}>
            <SummaryChip
              icon={<Clock size={16} color={Colors.vivid} />}
              value={formatDuration(data.duration)}
              label="Duración"
              accent={Colors.vivid}
            />
            <SummaryChip
              icon={<Dumbbell size={16} color="#10B981" />}
              value={String(summary?.exercisesCompleted ?? data.exercises.length)}
              label="Ejercicios"
              accent="#10B981"
            />
          </View>
          <View style={dStyles.chipRow}>
            <SummaryChip
              icon={<BarChart2 size={16} color="#8B5CF6" />}
              value={String(
                summary?.totalSets ?? data.exercises.reduce((s, e) => s + e.sets.length, 0)
              )}
              label="Series"
              accent="#8B5CF6"
            />
            <SummaryChip
              icon={<TrendingUp size={16} color="#F59E0B" />}
              value={summary?.totalVolume ? formatVolume(summary.totalVolume) : '—'}
              label="Volumen"
              accent="#F59E0B"
            />
          </View>

          {/* ─── Personal Records ─────────────────────────────── */}
          {prs.length > 0 && (
            <>
              <Text style={dStyles.sectionTitle}>Records personales 🏆</Text>
              <View style={dStyles.prCard}>
                {prs.map((pr) => (
                  <View key={pr.exerciseId} style={dStyles.prRow}>
                    <Star size={14} color="#F59E0B" fill="#F59E0B" />
                    <View style={dStyles.prInfo}>
                      <Text style={dStyles.prName}>{pr.exerciseName}</Text>
                      <Text style={dStyles.prVals}>
                        {pr.previousPR} → {pr.newPR} kg
                      </Text>
                    </View>
                    <View style={dStyles.prBadge}>
                      <Text style={dStyles.prBadgeText}>+{pr.improvement.toFixed(1)}%</Text>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* ─── Exercises ────────────────────────────────────── */}
          <Text style={dStyles.sectionTitle}>Ejercicios ({data.exercises.length})</Text>
          {data.exercises
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((ex, i) => (
              <ExerciseCard key={ex.id} ex={ex} index={i} />
            ))}

          {/* ─── Notes ────────────────────────────────────────── */}
          {data.notes ? (
            <>
              <Text style={dStyles.sectionTitle}>Notas</Text>
              <View style={dStyles.notesCard}>
                <Text style={dStyles.notesText}>{data.notes}</Text>
              </View>
            </>
          ) : null}

          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </View>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────

const dStyles = StyleSheet.create({
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
  },
  headerTitle: {
    ...Typography.displaySm,
    color: '#fff',
  },
  headerSub: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
    textTransform: 'capitalize',
  },

  content: {
    paddingHorizontal: Spacing.screenX,
    paddingTop: Spacing.xl,
  },

  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.muted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
    marginTop: Spacing.xl,
  },

  chipRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  chip: {
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
  chipValue: {
    ...Typography.displaySm,
    color: Colors.ink,
    marginTop: 4,
  },
  chipLabel: {
    ...Typography.meta,
    color: Colors.muted,
  },

  prCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: '#FCD34D',
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadows.account,
  },
  prRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  prInfo: { flex: 1 },
  prName: {
    ...Typography.bodyStrong,
    color: Colors.ink,
  },
  prVals: {
    ...Typography.caption,
    color: Colors.muted,
  },
  prBadge: {
    backgroundColor: '#F59E0B',
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  prBadgeText: {
    ...Typography.metaStrong,
    color: '#fff',
  },

  exCard: {
    backgroundColor: Colors.surfaceSolid,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.line,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.account,
  },
  exHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  exNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exNumText: {
    ...Typography.metaStrong,
    color: '#fff',
  },
  exInfo: { flex: 1 },
  exName: {
    ...Typography.bodyStrong,
    color: Colors.ink,
    marginBottom: 4,
  },
  exMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  muscleBadge: {
    backgroundColor: Colors.bgMid,
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  muscleBadgeText: {
    ...Typography.micro,
    color: Colors.muted,
    fontWeight: '600',
  },
  rpeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    borderRadius: Radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  rpeText: {
    ...Typography.micro,
    color: '#D97706',
    fontWeight: '600',
  },
  exVol: {
    ...Typography.micro,
    color: Colors.vivid,
    fontWeight: '600',
  },
  exNotes: {
    ...Typography.caption,
    color: Colors.muted,
    fontStyle: 'italic',
    marginBottom: Spacing.sm,
    paddingHorizontal: 4,
  },

  setsTable: {
    borderRadius: Radius.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.line,
  },
  setRowHead: {
    flexDirection: 'row',
    backgroundColor: Colors.bgMid,
    paddingVertical: 6,
    paddingHorizontal: Spacing.sm,
  },
  setRow: {
    flexDirection: 'row',
    paddingVertical: 7,
    paddingHorizontal: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
  },
  setRowSkipped: {
    opacity: 0.45,
  },
  setCell: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.muted,
  },
  setCellNum: { width: 28 },
  setCellReps: { flex: 1 },
  setCellWeight: { flex: 2 },
  setCellStatus: { width: 28, textAlign: 'center' },
  setVal: {
    color: Colors.ink,
    fontWeight: '600',
  },
  setDone: { color: '#10B981' },
  setSkipped: { color: Colors.muted },

  notesCard: {
    backgroundColor: Colors.surfaceSolid,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.line,
    padding: Spacing.lg,
    ...Shadows.account,
  },
  notesText: {
    ...Typography.body,
    color: Colors.ink,
    lineHeight: 22,
  },

  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 64,
    gap: Spacing.md,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.muted,
  },
});
