import { Exercise, MuscleGroup } from '../../../generated/prisma/client.js';
import { logger } from '../../../lib/logger.js';
import { PushContext, logIfConflict } from '../push-context.js';
import { recordTombstones } from '../tombstone.service.js';
import { ExerciseRaw } from '../types.js';

/**
 * Ejercicios (fitness). Hard delete con tombstones; como el REST, el delete se
 * salta si el ejercicio está referenciado (FK Restrict desde rutinas/workouts).
 * Unique (userId, name): colisión de create se fusiona en la fila existente
 * con tombstone del id entrante; el remap corrige los hijos del mismo push.
 */

const MUSCLE_GROUPS = new Set<string>(Object.values(MuscleGroup));

export function toRaw(e: Exercise): ExerciseRaw {
  return {
    id: e.id,
    name: e.name,
    muscle_group: e.muscleGroup,
    notes: e.notes,
    created_at: e.createdAt.getTime(),
    updated_at: e.updatedAt.getTime(),
  };
}

function dataFromRaw(raw: ExerciseRaw) {
  return {
    name: raw.name,
    muscleGroup:
      raw.muscle_group && MUSCLE_GROUPS.has(raw.muscle_group)
        ? (raw.muscle_group as MuscleGroup)
        : null,
    notes: raw.notes,
  };
}

export async function applyCreated(
  ctx: PushContext,
  raws: ExerciseRaw[]
): Promise<Map<string, string>> {
  const remap = new Map<string, string>();

  for (const raw of raws) {
    const existing = await ctx.tx.exercise.findUnique({ where: { id: raw.id } });
    if (existing) continue;

    const tombstone = await ctx.tx.replicationTombstone.findUnique({
      where: { tableName_rowId: { tableName: 'exercises', rowId: raw.id } },
    });
    if (tombstone) {
      logger.warn(`[replication] exercise ${raw.id} con tombstone previo: create ignorado`);
      continue;
    }

    const byName = await ctx.tx.exercise.findUnique({
      where: { userId_name: { userId: ctx.userId, name: raw.name } },
    });
    if (byName) {
      logger.warn(
        `[replication] exercise ${raw.id} colisiona por nombre con ${byName.id}: se fusiona`
      );
      await ctx.tx.exercise.update({ where: { id: byName.id }, data: dataFromRaw(raw) });
      await recordTombstones(ctx.tx, ctx.userId, 'exercises', [raw.id]);
      remap.set(raw.id, byName.id);
      continue;
    }

    await ctx.tx.exercise.create({
      data: { id: raw.id, userId: ctx.userId, ...dataFromRaw(raw) },
    });
  }

  return remap;
}

export async function applyUpdated(ctx: PushContext, raws: ExerciseRaw[]): Promise<void> {
  for (let raw of raws) {
    const existing = await ctx.tx.exercise.findUnique({ where: { id: raw.id } });
    if (!existing) {
      await applyCreated(ctx, [raw]);
      continue;
    }
    if (existing.userId !== ctx.userId) continue;

    // Rename que colisiona con otro ejercicio del usuario: se conserva el previo
    if (raw.name !== existing.name) {
      const byName = await ctx.tx.exercise.findUnique({
        where: { userId_name: { userId: ctx.userId, name: raw.name } },
      });
      if (byName && byName.id !== raw.id) {
        logger.warn(
          `[replication] update de exercise ${raw.id} renombra a "${raw.name}" que ya existe: se conserva el nombre previo`
        );
        raw = { ...raw, name: existing.name };
      }
    }

    logIfConflict(ctx, 'exercises', raw.id, existing.updatedAt);
    await ctx.tx.exercise.update({ where: { id: raw.id }, data: dataFromRaw(raw) });
  }
}

export async function applyDeleted(ctx: PushContext, ids: string[]): Promise<void> {
  for (const id of ids) {
    const existing = await ctx.tx.exercise.findUnique({ where: { id } });
    if (!existing) {
      await recordTombstones(ctx.tx, ctx.userId, 'exercises', [id]);
      continue;
    }
    if (existing.userId !== ctx.userId) continue;

    // FK Restrict: no se puede borrar si está en rutinas o workouts (como el REST)
    const [inRoutines, inWorkouts] = await Promise.all([
      ctx.tx.routineExercise.count({ where: { exerciseId: id } }),
      ctx.tx.workoutExercise.count({ where: { exerciseId: id } }),
    ]);
    if (inRoutines > 0 || inWorkouts > 0) {
      logger.warn(
        `[replication] delete de exercise ${id} ignorado: referenciado por rutinas/workouts`
      );
      continue;
    }

    await recordTombstones(ctx.tx, ctx.userId, 'exercises', [id]);
    await ctx.tx.exercise.delete({ where: { id } });
  }
}
