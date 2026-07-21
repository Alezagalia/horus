import { Q } from '@nozbe/watermelondb';
import { database } from './index';
import { requestSync } from './syncScheduler';
import {
  exercises,
  routines,
  routineExercises,
  workouts,
  workoutExercises,
  workoutSets,
} from './fitnessQueries';
import type {
  CreateExerciseDTO,
  CreateRoutineDTO,
  UpdateExerciseDTO,
  UpdateRoutineDTO,
} from '@horus/shared';
import type {
  AddSetDTO,
  StartedWorkout,
  WorkoutSet as ApiWorkoutSet,
} from '@/services/api/workoutApi';

/**
 * Escrituras locales de fitness (offline-first). Todo hard delete (el server
 * genera tombstones); los hijos se borran explícitamente (WMDB no cascadea).
 */

// ─── Exercises ────────────────────────────────────────────────────────────────

export async function createExerciseLocal(dto: CreateExerciseDTO): Promise<void> {
  await database.write(async () => {
    await exercises().create((e) => {
      e.name = dto.name;
      e.muscleGroup = dto.muscleGroup ?? undefined;
      e.notes = dto.notes ?? undefined;
    });
  });
  requestSync();
}

export async function updateExerciseLocal(id: string, dto: UpdateExerciseDTO): Promise<void> {
  await database.write(async () => {
    const exercise = await exercises().find(id);
    await exercise.update((e) => {
      if (dto.name !== undefined) e.name = dto.name;
      if (dto.muscleGroup !== undefined) e.muscleGroup = dto.muscleGroup ?? undefined;
      if (dto.notes !== undefined) e.notes = dto.notes ?? undefined;
    });
  });
  requestSync();
}

/** Misma regla que el REST: no se borra si está en rutinas o workouts. */
export async function deleteExerciseLocal(id: string): Promise<void> {
  const [inRoutines, inWorkouts] = await Promise.all([
    routineExercises().query(Q.where('exercise_id', id)).fetchCount(),
    workoutExercises().query(Q.where('exercise_id', id)).fetchCount(),
  ]);
  if (inRoutines > 0 || inWorkouts > 0) {
    throw new Error('No se puede eliminar: el ejercicio está en rutinas o entrenamientos');
  }
  await database.write(async () => {
    const exercise = await exercises().find(id);
    await exercise.markAsDeleted();
  });
  requestSync();
}

// ─── Routines ─────────────────────────────────────────────────────────────────

export async function createRoutineLocal(dto: CreateRoutineDTO): Promise<void> {
  await database.write(async () => {
    const routine = await routines().create((r) => {
      r.name = dto.name;
      r.description = dto.description ?? undefined;
    });
    for (const ex of dto.exercises) {
      await routineExercises().create((re) => {
        re.routineId = routine.id;
        re.exerciseId = ex.exerciseId;
        re.sortOrder = ex.order;
        re.targetSets = ex.targetSets ?? undefined;
        re.targetReps = ex.targetReps ?? undefined;
        re.targetWeight = ex.targetWeight ?? undefined;
        re.restTime = ex.restTime ?? undefined;
        re.notes = ex.notes ?? undefined;
      });
    }
  });
  requestSync();
}

/** Si el DTO trae `exercises`, reemplaza la configuración completa (como el REST). */
export async function updateRoutineLocal(id: string, dto: UpdateRoutineDTO): Promise<void> {
  await database.write(async () => {
    const routine = await routines().find(id);
    await routine.update((r) => {
      if (dto.name !== undefined) r.name = dto.name;
      if (dto.description !== undefined) r.description = dto.description ?? undefined;
    });
    if (dto.exercises) {
      const existing = await routineExercises().query(Q.where('routine_id', id)).fetch();
      for (const re of existing) await re.markAsDeleted();
      for (const ex of dto.exercises) {
        await routineExercises().create((re) => {
          re.routineId = id;
          re.exerciseId = ex.exerciseId;
          re.sortOrder = ex.order;
          re.targetSets = ex.targetSets ?? undefined;
          re.targetReps = ex.targetReps ?? undefined;
          re.targetWeight = ex.targetWeight ?? undefined;
          re.restTime = ex.restTime ?? undefined;
          re.notes = ex.notes ?? undefined;
        });
      }
    }
  });
  requestSync();
}

export async function deleteRoutineLocal(id: string): Promise<void> {
  await database.write(async () => {
    const routine = await routines().find(id);
    const refs = await routineExercises().query(Q.where('routine_id', id)).fetch();
    for (const re of refs) await re.markAsDeleted();
    await routine.markAsDeleted();
  });
  requestSync();
}

// ─── Workouts ─────────────────────────────────────────────────────────────────

/** Crea el workout con sus ejercicios desde la rutina y devuelve la misma
 * forma que el POST /routines/:id/start. Como el REST, no permite dos
 * entrenamientos activos. */
export async function startWorkoutLocal(routineId: string): Promise<StartedWorkout> {
  const active = await workouts().query(Q.where('end_time', null)).fetchCount();
  if (active > 0) {
    throw new Error('Ya hay un entrenamiento en curso');
  }

  const refs = await routineExercises()
    .query(Q.where('routine_id', routineId), Q.sortBy('sort_order', Q.asc))
    .fetch();
  const exerciseIds = refs.map((re) => re.exerciseId);
  const exerciseRows = exerciseIds.length
    ? await exercises()
        .query(Q.where('id', Q.oneOf(exerciseIds)))
        .fetch()
    : [];
  const exerciseById = new Map(exerciseRows.map((e) => [e.id, e]));

  const result = await database.write(async () => {
    const workout = await workouts().create((w) => {
      w.routineId = routineId;
      w.startTime = new Date();
    });

    const startedExercises = [];
    for (const re of refs) {
      const we = await workoutExercises().create((x) => {
        x.workoutId = workout.id;
        x.exerciseId = re.exerciseId;
        x.sortOrder = re.sortOrder;
      });
      startedExercises.push({
        workoutExerciseId: we.id,
        exerciseId: re.exerciseId,
        exerciseName: exerciseById.get(re.exerciseId)?.name ?? '',
        muscleGroup: exerciseById.get(re.exerciseId)?.muscleGroup ?? '',
        order: re.sortOrder,
        targetSets: re.targetSets ?? null,
        targetReps: re.targetReps ?? null,
        targetWeight: re.targetWeight ?? null,
        sets: [] as ApiWorkoutSet[],
      });
    }

    return {
      workout: {
        id: workout.id,
        routineId,
        startTime: workout.startTime.toISOString(),
      },
      exercises: startedExercises,
    };
  });

  requestSync();
  return result;
}

export async function finishWorkoutLocal(workoutId: string): Promise<void> {
  await database.write(async () => {
    const workout = await workouts().find(workoutId);
    await workout.update((w) => {
      w.endTime = new Date();
    });
  });
  requestSync();
}

/** Cancelar descarta la sesión completa (como el DELETE /workouts/:id/cancel). */
export async function cancelWorkoutLocal(workoutId: string): Promise<void> {
  await database.write(async () => {
    const workout = await workouts().find(workoutId);
    const wes = await workoutExercises().query(Q.where('workout_id', workoutId)).fetch();
    if (wes.length > 0) {
      const sets = await workoutSets()
        .query(Q.where('workout_exercise_id', Q.oneOf(wes.map((we) => we.id))))
        .fetch();
      for (const s of sets) await s.markAsDeleted();
      for (const we of wes) await we.markAsDeleted();
    }
    await workout.markAsDeleted();
  });
  requestSync();
}

export async function addSetLocal(
  workoutExerciseId: string,
  dto: AddSetDTO
): Promise<ApiWorkoutSet> {
  const created = await database.write(async () => {
    const existing = await workoutSets()
      .query(Q.where('workout_exercise_id', workoutExerciseId))
      .fetchCount();
    return workoutSets().create((s) => {
      s.workoutExerciseId = workoutExerciseId;
      s.setNumber = existing + 1;
      s.reps = dto.reps;
      s.weight = dto.weight;
      s.weightUnit = dto.weightUnit ?? 'kg';
      s.completed = dto.completed ?? true;
      s.notes = dto.notes ?? undefined;
      s.timestamp = new Date();
    });
  });
  requestSync();
  return {
    id: created.id,
    setNumber: created.setNumber,
    reps: created.reps,
    weight: created.weight,
    weightUnit: created.weightUnit,
    completed: created.completed,
    notes: created.notes ?? null,
    timestamp: created.timestamp.toISOString(),
  };
}

export async function deleteSetLocal(setId: string): Promise<void> {
  await database.write(async () => {
    const set = await workoutSets().find(setId);
    await set.markAsDeleted();
  });
  requestSync();
}
