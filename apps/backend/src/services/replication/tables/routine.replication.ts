import { Routine, RoutineExercise } from '../../../generated/prisma/client.js';
import { logger } from '../../../lib/logger.js';
import { PushContext, logIfConflict } from '../push-context.js';
import { recordTombstones } from '../tombstone.service.js';
import { RoutineExerciseRaw, RoutineRaw } from '../types.js';

/**
 * Rutinas + configuración de ejercicios (fitness). Hard delete con tombstones
 * (la rutina cascadea sus routine_exercises). RoutineExercise sin userId
 * propio (ownership vía su routine), unique (routineId, exerciseId) —
 * colisión se fusiona en la fila existente con tombstone del id entrante.
 */

export function toRaw(r: Routine): RoutineRaw {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    created_at: r.createdAt.getTime(),
    updated_at: r.updatedAt.getTime(),
  };
}

export function exerciseToRaw(re: RoutineExercise): RoutineExerciseRaw {
  return {
    id: re.id,
    routine_id: re.routineId,
    exercise_id: re.exerciseId,
    sort_order: re.order,
    target_sets: re.targetSets,
    target_reps: re.targetReps,
    target_weight: re.targetWeight != null ? Number(re.targetWeight) : null,
    rest_time: re.restTime,
    notes: re.notes,
    created_at: re.createdAt.getTime(),
    updated_at: re.updatedAt.getTime(),
  };
}

export async function applyCreated(ctx: PushContext, raws: RoutineRaw[]): Promise<void> {
  for (const raw of raws) {
    const existing = await ctx.tx.routine.findUnique({ where: { id: raw.id } });
    if (existing) continue;

    const tombstone = await ctx.tx.replicationTombstone.findUnique({
      where: { tableName_rowId: { tableName: 'routines', rowId: raw.id } },
    });
    if (tombstone) {
      logger.warn(`[replication] routine ${raw.id} con tombstone previo: create ignorado`);
      continue;
    }

    await ctx.tx.routine.create({
      data: { id: raw.id, userId: ctx.userId, name: raw.name, description: raw.description },
    });
  }
}

export async function applyUpdated(ctx: PushContext, raws: RoutineRaw[]): Promise<void> {
  for (const raw of raws) {
    const existing = await ctx.tx.routine.findUnique({ where: { id: raw.id } });
    if (!existing) {
      await applyCreated(ctx, [raw]);
      continue;
    }
    if (existing.userId !== ctx.userId) continue;
    logIfConflict(ctx, 'routines', raw.id, existing.updatedAt);

    await ctx.tx.routine.update({
      where: { id: raw.id },
      data: { name: raw.name, description: raw.description },
    });
  }
}

export async function applyDeleted(ctx: PushContext, ids: string[]): Promise<void> {
  for (const id of ids) {
    const existing = await ctx.tx.routine.findUnique({
      where: { id },
      include: { routineExercises: { select: { id: true } } },
    });
    if (!existing) {
      await recordTombstones(ctx.tx, ctx.userId, 'routines', [id]);
      continue;
    }
    if (existing.userId !== ctx.userId) continue;

    await recordTombstones(
      ctx.tx,
      ctx.userId,
      'routine_exercises',
      existing.routineExercises.map((re) => re.id)
    );
    await recordTombstones(ctx.tx, ctx.userId, 'routines', [id]);
    await ctx.tx.routine.delete({ where: { id } }); // cascadea routine_exercises
  }
}

export async function applyExercises(
  ctx: PushContext,
  raws: RoutineExerciseRaw[],
  exerciseRemap: Map<string, string>
): Promise<void> {
  for (const raw of raws) {
    const data = {
      order: raw.sort_order,
      targetSets: raw.target_sets,
      targetReps: raw.target_reps,
      targetWeight: raw.target_weight,
      restTime: raw.rest_time,
      notes: raw.notes,
    };

    const existing = await ctx.tx.routineExercise.findUnique({
      where: { id: raw.id },
      include: { routine: { select: { userId: true } } },
    });
    if (existing) {
      if (existing.routine.userId !== ctx.userId) continue;
      // routine_id/exercise_id no se aceptan (re-parenting)
      await ctx.tx.routineExercise.update({ where: { id: raw.id }, data });
      continue;
    }

    const tombstone = await ctx.tx.replicationTombstone.findUnique({
      where: { tableName_rowId: { tableName: 'routine_exercises', rowId: raw.id } },
    });
    if (tombstone) continue;

    const routine = await ctx.tx.routine.findUnique({ where: { id: raw.routine_id } });
    if (!routine || routine.userId !== ctx.userId) {
      logger.warn(`[replication] routine_exercise ${raw.id} de rutina ajena/inexistente: ignorado`);
      continue;
    }
    const exerciseId = exerciseRemap.get(raw.exercise_id) ?? raw.exercise_id;
    const exercise = await ctx.tx.exercise.findUnique({ where: { id: exerciseId } });
    if (!exercise || exercise.userId !== ctx.userId) {
      logger.warn(
        `[replication] routine_exercise ${raw.id} con ejercicio ajeno/inexistente: ignorado`
      );
      continue;
    }

    // Unique (routineId, exerciseId): mismo ejercicio agregado por otra vía → fusionar
    const byPair = await ctx.tx.routineExercise.findUnique({
      where: { routineId_exerciseId: { routineId: raw.routine_id, exerciseId } },
    });
    if (byPair) {
      logger.warn(
        `[replication] routine_exercise ${raw.id} colisiona con ${byPair.id} (misma rutina/ejercicio): se fusiona`
      );
      await ctx.tx.routineExercise.update({ where: { id: byPair.id }, data });
      await recordTombstones(ctx.tx, ctx.userId, 'routine_exercises', [raw.id]);
      continue;
    }

    await ctx.tx.routineExercise.create({
      data: { id: raw.id, routineId: raw.routine_id, exerciseId, ...data },
    });
  }
}

export async function deleteExercises(ctx: PushContext, ids: string[]): Promise<void> {
  for (const id of ids) {
    const existing = await ctx.tx.routineExercise.findUnique({
      where: { id },
      include: { routine: { select: { userId: true } } },
    });
    if (!existing) {
      await recordTombstones(ctx.tx, ctx.userId, 'routine_exercises', [id]);
      continue;
    }
    if (existing.routine.userId !== ctx.userId) continue;

    await recordTombstones(ctx.tx, ctx.userId, 'routine_exercises', [id]);
    await ctx.tx.routineExercise.delete({ where: { id } });
  }
}
