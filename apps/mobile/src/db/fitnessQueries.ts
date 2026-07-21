import { Q } from '@nozbe/watermelondb';
import { database } from './index';
import { Exercise as ExerciseModel } from './models/Exercise';
import { Routine as RoutineModel } from './models/Routine';
import { RoutineExercise as RoutineExerciseModel } from './models/RoutineExercise';
import { Workout as WorkoutModel } from './models/Workout';
import { WorkoutExercise as WorkoutExerciseModel } from './models/WorkoutExercise';
import { WorkoutSet as WorkoutSetModel } from './models/WorkoutSet';
import type { ExerciseWithStats, MuscleGroup, RoutineDetail } from '@horus/shared';
import type {
  Routine as RoutineSummary,
  WorkoutDetailResponse,
  WorkoutSummaryItem,
  WorkoutSet as ApiWorkoutSet,
} from '@/services/api/workoutApi';

/**
 * Lecturas locales de fitness (offline-first). Devuelven las mismas formas que
 * la API REST; los stats (veces ejecutada, volumen, PRs) se calculan acá desde
 * las tablas locales. `summary.personalRecords` del detalle viene vacío: el
 * cálculo histórico de PRs es del server y la UI lo trata como opcional.
 */

export const exercises = () => database.get<ExerciseModel>('exercises');
export const routines = () => database.get<RoutineModel>('routines');
export const routineExercises = () => database.get<RoutineExerciseModel>('routine_exercises');
export const workouts = () => database.get<WorkoutModel>('workouts');
export const workoutExercises = () => database.get<WorkoutExerciseModel>('workout_exercises');
export const workoutSets = () => database.get<WorkoutSetModel>('workout_sets');

function toSet(s: WorkoutSetModel): ApiWorkoutSet {
  return {
    id: s.id,
    setNumber: s.setNumber,
    reps: s.reps,
    weight: s.weight,
    weightUnit: s.weightUnit,
    completed: s.completed,
    notes: s.notes ?? null,
    timestamp: s.timestamp.toISOString(),
  };
}

/** Minutos entre start y end (como el `duration` del server). */
function durationMinutes(w: WorkoutModel): number | null {
  if (!w.endTime) return null;
  return Math.round((w.endTime.getTime() - w.startTime.getTime()) / 60000);
}

// ─── Exercises ────────────────────────────────────────────────────────────────

export async function listExercisesLocal(muscleGroup?: MuscleGroup): Promise<ExerciseWithStats[]> {
  const clauses = muscleGroup ? [Q.where('muscle_group', muscleGroup)] : [];
  const rows = await exercises()
    .query(...clauses)
    .fetch();
  if (rows.length === 0) return [];

  const ids = rows.map((e) => e.id);
  const [routineRefs, workoutRefs] = await Promise.all([
    routineExercises()
      .query(Q.where('exercise_id', Q.oneOf(ids)))
      .fetch(),
    workoutExercises()
      .query(Q.where('exercise_id', Q.oneOf(ids)))
      .fetch(),
  ]);
  const workoutIds = [...new Set(workoutRefs.map((we) => we.workoutId))];
  const workoutRows = workoutIds.length
    ? await workouts()
        .query(Q.where('id', Q.oneOf(workoutIds)))
        .fetch()
    : [];
  const workoutById = new Map(workoutRows.map((w) => [w.id, w]));

  const result = rows.map((e): ExerciseWithStats => {
    const inWorkouts = workoutRefs.filter((we) => we.exerciseId === e.id);
    let lastUsed: string | null = null;
    for (const we of inWorkouts) {
      const w = workoutById.get(we.workoutId);
      if (w && (!lastUsed || w.startTime.toISOString() > lastUsed)) {
        lastUsed = w.startTime.toISOString();
      }
    }
    return {
      id: e.id,
      userId: '',
      name: e.name,
      muscleGroup: (e.muscleGroup as MuscleGroup) ?? null,
      notes: e.notes ?? null,
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
      usedInRoutines: routineRefs.filter((re) => re.exerciseId === e.id).length,
      usedInWorkouts: inWorkouts.length,
      lastUsed,
    };
  });
  result.sort((a, b) => a.name.localeCompare(b.name));
  return result;
}

// ─── Routines ─────────────────────────────────────────────────────────────────

export async function listRoutinesLocal(): Promise<RoutineSummary[]> {
  const rows = await routines().query().fetch();
  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.id);
  const [refs, workoutRows] = await Promise.all([
    routineExercises()
      .query(Q.where('routine_id', Q.oneOf(ids)))
      .fetch(),
    workouts()
      .query(Q.where('routine_id', Q.oneOf(ids)), Q.where('end_time', Q.notEq(null)))
      .fetch(),
  ]);

  const result = rows.map((r): RoutineSummary => {
    const executed = workoutRows.filter((w) => w.routineId === r.id);
    const lastExecuted = executed.reduce<string | null>(
      (max, w) => (!max || w.startTime.toISOString() > max ? w.startTime.toISOString() : max),
      null
    );
    return {
      id: r.id,
      name: r.name,
      description: r.description,
      exerciseCount: refs.filter((re) => re.routineId === r.id).length,
      lastExecuted,
      timesExecuted: executed.length,
      createdAt: r.createdAt.toISOString(),
    };
  });
  result.sort((a, b) => a.name.localeCompare(b.name));
  return result;
}

export async function getRoutineDetailLocal(id: string): Promise<RoutineDetail> {
  const routine = await routines().find(id);
  const refs = await routineExercises().query(Q.where('routine_id', id)).fetch();
  const exerciseIds = refs.map((re) => re.exerciseId);
  const exerciseRows = exerciseIds.length
    ? await exercises()
        .query(Q.where('id', Q.oneOf(exerciseIds)))
        .fetch()
    : [];
  const exerciseById = new Map(exerciseRows.map((e) => [e.id, e]));

  const executed = await workouts()
    .query(Q.where('routine_id', id), Q.where('end_time', Q.notEq(null)))
    .fetch();
  const lastExecuted = executed.reduce<string | null>(
    (max, w) => (!max || w.startTime.toISOString() > max ? w.startTime.toISOString() : max),
    null
  );
  const durations = executed.map(durationMinutes).filter((d): d is number => d != null);

  return {
    id: routine.id,
    userId: '',
    name: routine.name,
    description: routine.description ?? null,
    createdAt: routine.createdAt.toISOString(),
    updatedAt: routine.updatedAt.toISOString(),
    exercises: refs
      .map((re) => ({
        id: re.id,
        routineId: re.routineId,
        exerciseId: re.exerciseId,
        order: re.sortOrder,
        targetSets: re.targetSets ?? null,
        targetReps: re.targetReps ?? null,
        targetWeight: re.targetWeight ?? null,
        restTime: re.restTime ?? null,
        notes: re.notes ?? null,
        exerciseName: exerciseById.get(re.exerciseId)?.name ?? '',
        muscleGroup: (exerciseById.get(re.exerciseId)?.muscleGroup as MuscleGroup) ?? null,
      }))
      .sort((a, b) => a.order - b.order),
    stats: {
      timesExecuted: executed.length,
      lastExecuted,
      avgDuration: durations.length
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : null,
    },
  };
}

// ─── Workouts ─────────────────────────────────────────────────────────────────

async function setsForWorkoutExercises(weIds: string[]): Promise<Map<string, WorkoutSetModel[]>> {
  if (weIds.length === 0) return new Map();
  const rows = await workoutSets()
    .query(Q.where('workout_exercise_id', Q.oneOf(weIds)))
    .fetch();
  const map = new Map<string, WorkoutSetModel[]>();
  for (const s of rows) {
    const list = map.get(s.workoutExerciseId) ?? [];
    list.push(s);
    map.set(s.workoutExerciseId, list);
  }
  for (const list of map.values()) list.sort((a, b) => a.setNumber - b.setNumber);
  return map;
}

export async function listWorkoutsLocal(params?: { page?: number; limit?: number }): Promise<{
  workouts: WorkoutSummaryItem[];
  pagination: { page: number; limit: number; total: number };
}> {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;

  const rows = await workouts()
    .query(Q.where('end_time', Q.notEq(null)), Q.sortBy('start_time', Q.desc))
    .fetch();
  const pageRows = rows.slice((page - 1) * limit, page * limit);

  const routineIds = [...new Set(pageRows.map((w) => w.routineId).filter(Boolean))] as string[];
  const routineRows = routineIds.length
    ? await routines()
        .query(Q.where('id', Q.oneOf(routineIds)))
        .fetch()
    : [];
  const routineById = new Map(routineRows.map((r) => [r.id, r]));

  const weRows = pageRows.length
    ? await workoutExercises()
        .query(Q.where('workout_id', Q.oneOf(pageRows.map((w) => w.id))))
        .fetch()
    : [];
  const setsByWe = await setsForWorkoutExercises(weRows.map((we) => we.id));

  const items = pageRows.map((w): WorkoutSummaryItem => {
    const wes = weRows.filter((we) => we.workoutId === w.id);
    const sets = wes.flatMap((we) => setsByWe.get(we.id) ?? []);
    return {
      id: w.id,
      routineId: w.routineId ?? '',
      routineName: w.routineId ? (routineById.get(w.routineId)?.name ?? null) : null,
      startTime: w.startTime.toISOString(),
      duration: durationMinutes(w) ?? 0,
      exercisesCompleted: wes.length,
      totalSets: sets.length,
      totalVolume: sets.reduce((acc, s) => acc + s.reps * s.weight, 0),
    };
  });

  return { workouts: items, pagination: { page, limit, total: rows.length } };
}

export async function getWorkoutDetailLocal(id: string): Promise<WorkoutDetailResponse> {
  const workout = await workouts().find(id);
  const routine = workout.routineId
    ? await routines()
        .find(workout.routineId)
        .catch(() => null)
    : null;

  const weRows = await workoutExercises()
    .query(Q.where('workout_id', id), Q.sortBy('sort_order', Q.asc))
    .fetch();
  const setsByWe = await setsForWorkoutExercises(weRows.map((we) => we.id));
  const exerciseIds = [...new Set(weRows.map((we) => we.exerciseId))];
  const exerciseRows = exerciseIds.length
    ? await exercises()
        .query(Q.where('id', Q.oneOf(exerciseIds)))
        .fetch()
    : [];
  const exerciseById = new Map(exerciseRows.map((e) => [e.id, e]));

  const allSets = weRows.flatMap((we) => setsByWe.get(we.id) ?? []);
  const totalVolume = allSets.reduce((acc, s) => acc + s.reps * s.weight, 0);

  return {
    id: workout.id,
    routineId: workout.routineId ?? null,
    routineName: routine?.name ?? null,
    startTime: workout.startTime.toISOString(),
    endTime: workout.endTime?.toISOString() ?? null,
    duration: durationMinutes(workout),
    notes: workout.notes ?? null,
    exercises: weRows.map((we) => ({
      id: we.id,
      exerciseId: we.exerciseId,
      exerciseName: exerciseById.get(we.exerciseId)?.name ?? '',
      muscleGroup: exerciseById.get(we.exerciseId)?.muscleGroup ?? null,
      order: we.sortOrder,
      rpe: we.rpe ?? null,
      notes: we.notes ?? null,
      sets: (setsByWe.get(we.id) ?? []).map((s) => ({
        setNumber: s.setNumber,
        reps: s.reps,
        weight: s.weight,
        weightUnit: s.weightUnit,
        completed: s.completed,
        restTime: s.restTime ?? null,
        timestamp: s.timestamp.toISOString(),
      })),
    })),
    summary: workout.endTime
      ? {
          exercisesCompleted: weRows.length,
          totalSets: allSets.length,
          totalReps: allSets.reduce((acc, s) => acc + s.reps, 0),
          totalVolume,
          avgWeight: allSets.length
            ? allSets.reduce((acc, s) => acc + s.weight, 0) / allSets.length
            : 0,
          personalRecords: [], // cálculo histórico server-side; opcional en la UI
        }
      : null,
  };
}
