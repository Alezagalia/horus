import {
  WeightUnit,
  Workout,
  WorkoutExercise,
  WorkoutSet,
} from '../../../generated/prisma/client.js';
import { logger } from '../../../lib/logger.js';
import { PushContext, logIfConflict } from '../push-context.js';
import { recordTombstones } from '../tombstone.service.js';
import { WorkoutExerciseRaw, WorkoutRaw, WorkoutSetRaw } from '../types.js';

/**
 * Sesiones de entrenamiento: workouts → workout_exercises → workout_sets.
 * Hard delete con tombstones (cascada workout → exercises → sets). La regla
 * REST de "máximo un workout activo" NO se aplica en el push: descartar una
 * sesión entrenada offline sería peor que permitir dos activas (se loguea).
 */

const WEIGHT_UNITS = new Set<string>(Object.values(WeightUnit));

export function toRaw(w: Workout): WorkoutRaw {
  return {
    id: w.id,
    routine_id: w.routineId,
    start_time: w.startTime.getTime(),
    end_time: w.endTime?.getTime() ?? null,
    notes: w.notes,
    created_at: w.createdAt.getTime(),
    updated_at: w.updatedAt.getTime(),
  };
}

export function exerciseToRaw(we: WorkoutExercise): WorkoutExerciseRaw {
  return {
    id: we.id,
    workout_id: we.workoutId,
    exercise_id: we.exerciseId,
    sort_order: we.order,
    notes: we.notes,
    rpe: we.rpe,
    created_at: we.createdAt.getTime(),
    updated_at: we.updatedAt.getTime(),
  };
}

export function setToRaw(s: WorkoutSet): WorkoutSetRaw {
  return {
    id: s.id,
    workout_exercise_id: s.workoutExerciseId,
    set_number: s.setNumber,
    reps: s.reps,
    weight: Number(s.weight),
    weight_unit: s.weightUnit,
    completed: s.completed,
    rest_time: s.restTime,
    notes: s.notes,
    timestamp: s.timestamp.getTime(),
    created_at: s.createdAt.getTime(),
    updated_at: s.updatedAt.getTime(),
  };
}

/** routine ajena/inexistente → null (workout libre), como el SetNull del delete. */
async function safeRoutineId(ctx: PushContext, routineId: string | null): Promise<string | null> {
  if (!routineId) return null;
  const routine = await ctx.tx.routine.findUnique({ where: { id: routineId } });
  if (!routine || routine.userId !== ctx.userId) {
    logger.warn(`[replication] workout con rutina ajena/inexistente ${routineId}: se anula`);
    return null;
  }
  return routineId;
}

export async function applyCreated(ctx: PushContext, raws: WorkoutRaw[]): Promise<void> {
  for (const raw of raws) {
    const existing = await ctx.tx.workout.findUnique({ where: { id: raw.id } });
    if (existing) continue;

    const tombstone = await ctx.tx.replicationTombstone.findUnique({
      where: { tableName_rowId: { tableName: 'workouts', rowId: raw.id } },
    });
    if (tombstone) {
      logger.warn(`[replication] workout ${raw.id} con tombstone previo: create ignorado`);
      continue;
    }

    if (raw.end_time == null) {
      const active = await ctx.tx.workout.count({
        where: { userId: ctx.userId, endTime: null },
      });
      if (active > 0) {
        logger.warn(
          `[replication] workout ${raw.id} activo entra con otro activo existente (permitido en replicación)`
        );
      }
    }

    await ctx.tx.workout.create({
      data: {
        id: raw.id,
        userId: ctx.userId,
        routineId: await safeRoutineId(ctx, raw.routine_id),
        startTime: new Date(raw.start_time),
        endTime: raw.end_time != null ? new Date(raw.end_time) : null,
        notes: raw.notes,
      },
    });
  }
}

export async function applyUpdated(ctx: PushContext, raws: WorkoutRaw[]): Promise<void> {
  for (const raw of raws) {
    const existing = await ctx.tx.workout.findUnique({ where: { id: raw.id } });
    if (!existing) {
      await applyCreated(ctx, [raw]);
      continue;
    }
    if (existing.userId !== ctx.userId) continue;
    logIfConflict(ctx, 'workouts', raw.id, existing.updatedAt);

    await ctx.tx.workout.update({
      where: { id: raw.id },
      data: {
        routineId: await safeRoutineId(ctx, raw.routine_id),
        startTime: new Date(raw.start_time),
        endTime: raw.end_time != null ? new Date(raw.end_time) : null,
        notes: raw.notes,
      },
    });
  }
}

export async function applyDeleted(ctx: PushContext, ids: string[]): Promise<void> {
  for (const id of ids) {
    const existing = await ctx.tx.workout.findUnique({
      where: { id },
      include: {
        workoutExercises: { select: { id: true, workoutSets: { select: { id: true } } } },
      },
    });
    if (!existing) {
      await recordTombstones(ctx.tx, ctx.userId, 'workouts', [id]);
      continue;
    }
    if (existing.userId !== ctx.userId) continue;

    const exerciseIds = existing.workoutExercises.map((we) => we.id);
    const setIds = existing.workoutExercises.flatMap((we) => we.workoutSets.map((s) => s.id));
    await recordTombstones(ctx.tx, ctx.userId, 'workout_sets', setIds);
    await recordTombstones(ctx.tx, ctx.userId, 'workout_exercises', exerciseIds);
    await recordTombstones(ctx.tx, ctx.userId, 'workouts', [id]);
    await ctx.tx.workout.delete({ where: { id } }); // cascadea exercises y sets
  }
}

export async function applyExercises(
  ctx: PushContext,
  raws: WorkoutExerciseRaw[],
  exerciseRemap: Map<string, string>
): Promise<void> {
  for (const raw of raws) {
    const data = { order: raw.sort_order, notes: raw.notes, rpe: raw.rpe };

    const existing = await ctx.tx.workoutExercise.findUnique({
      where: { id: raw.id },
      include: { workout: { select: { userId: true } } },
    });
    if (existing) {
      if (existing.workout.userId !== ctx.userId) continue;
      // workout_id/exercise_id no se aceptan (re-parenting)
      await ctx.tx.workoutExercise.update({ where: { id: raw.id }, data });
      continue;
    }

    const tombstone = await ctx.tx.replicationTombstone.findUnique({
      where: { tableName_rowId: { tableName: 'workout_exercises', rowId: raw.id } },
    });
    if (tombstone) continue;

    const workout = await ctx.tx.workout.findUnique({ where: { id: raw.workout_id } });
    if (!workout || workout.userId !== ctx.userId) {
      logger.warn(
        `[replication] workout_exercise ${raw.id} de workout ajeno/inexistente: ignorado`
      );
      continue;
    }
    const exerciseId = exerciseRemap.get(raw.exercise_id) ?? raw.exercise_id;
    const exercise = await ctx.tx.exercise.findUnique({ where: { id: exerciseId } });
    if (!exercise || exercise.userId !== ctx.userId) {
      logger.warn(
        `[replication] workout_exercise ${raw.id} con ejercicio ajeno/inexistente: ignorado`
      );
      continue;
    }

    await ctx.tx.workoutExercise.create({
      data: { id: raw.id, workoutId: raw.workout_id, exerciseId, ...data },
    });
  }
}

export async function deleteExercises(ctx: PushContext, ids: string[]): Promise<void> {
  for (const id of ids) {
    const existing = await ctx.tx.workoutExercise.findUnique({
      where: { id },
      include: {
        workout: { select: { userId: true } },
        workoutSets: { select: { id: true } },
      },
    });
    if (!existing) {
      await recordTombstones(ctx.tx, ctx.userId, 'workout_exercises', [id]);
      continue;
    }
    if (existing.workout.userId !== ctx.userId) continue;

    await recordTombstones(
      ctx.tx,
      ctx.userId,
      'workout_sets',
      existing.workoutSets.map((s) => s.id)
    );
    await recordTombstones(ctx.tx, ctx.userId, 'workout_exercises', [id]);
    await ctx.tx.workoutExercise.delete({ where: { id } }); // cascadea sets
  }
}

export async function applySets(ctx: PushContext, raws: WorkoutSetRaw[]): Promise<void> {
  for (const raw of raws) {
    const weightUnit = WEIGHT_UNITS.has(raw.weight_unit)
      ? (raw.weight_unit as WeightUnit)
      : WeightUnit.kg;
    const data = {
      setNumber: raw.set_number,
      reps: raw.reps,
      weight: raw.weight,
      weightUnit,
      completed: raw.completed ?? true,
      restTime: raw.rest_time,
      notes: raw.notes,
      timestamp: new Date(raw.timestamp),
    };

    const existing = await ctx.tx.workoutSet.findUnique({
      where: { id: raw.id },
      include: { workoutExercise: { include: { workout: { select: { userId: true } } } } },
    });
    if (existing) {
      if (existing.workoutExercise.workout.userId !== ctx.userId) continue;
      // workout_exercise_id no se acepta (re-parenting)
      await ctx.tx.workoutSet.update({ where: { id: raw.id }, data });
      continue;
    }

    const tombstone = await ctx.tx.replicationTombstone.findUnique({
      where: { tableName_rowId: { tableName: 'workout_sets', rowId: raw.id } },
    });
    if (tombstone) continue;

    const parent = await ctx.tx.workoutExercise.findUnique({
      where: { id: raw.workout_exercise_id },
      include: { workout: { select: { userId: true } } },
    });
    if (!parent || parent.workout.userId !== ctx.userId) {
      logger.warn(`[replication] workout_set ${raw.id} de ejercicio ajeno/inexistente: ignorado`);
      continue;
    }

    await ctx.tx.workoutSet.create({
      data: { id: raw.id, workoutExerciseId: raw.workout_exercise_id, ...data },
    });
  }
}

export async function deleteSets(ctx: PushContext, ids: string[]): Promise<void> {
  for (const id of ids) {
    const existing = await ctx.tx.workoutSet.findUnique({
      where: { id },
      include: { workoutExercise: { include: { workout: { select: { userId: true } } } } },
    });
    if (!existing) {
      await recordTombstones(ctx.tx, ctx.userId, 'workout_sets', [id]);
      continue;
    }
    if (existing.workoutExercise.workout.userId !== ctx.userId) continue;

    await recordTombstones(ctx.tx, ctx.userId, 'workout_sets', [id]);
    await ctx.tx.workoutSet.delete({ where: { id } });
  }
}
