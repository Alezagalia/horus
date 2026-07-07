/**
 * Replicación de las tablas de vínculo GoalHabit y GoalTask.
 * Sin updatedAt en Prisma → el pull las manda COMPLETAS en cada ciclo (pocas
 * filas, upsert idempotente en Watermelon); los unlinks (hard delete) viajan
 * como tombstones. El cliente mobile hoy no las edita (solo lectura para el
 * cálculo de progreso), pero los handlers de push aceptan cambios por si la
 * UI mobile suma link/unlink más adelante.
 */

import { GoalHabit, GoalTask, Prisma } from '../../../generated/prisma/client.js';
import { logger } from '../../../lib/logger.js';
import { PushContext } from '../push-context.js';
import { recordTombstones } from '../tombstone.service.js';
import { GoalHabitRaw, GoalTaskRaw } from '../types.js';

export function goalHabitToRaw(l: GoalHabit): GoalHabitRaw {
  return {
    id: l.id,
    goal_id: l.goalId,
    habit_id: l.habitId,
    kr_id: l.krId,
    created_at: l.createdAt.getTime(),
  };
}

export function goalTaskToRaw(l: GoalTask): GoalTaskRaw {
  return {
    id: l.id,
    goal_id: l.goalId,
    task_id: l.taskId,
    created_at: l.createdAt.getTime(),
  };
}

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

async function goalBelongsToUser(ctx: PushContext, goalId: string): Promise<boolean> {
  const goal = await ctx.tx.goal.findUnique({ where: { id: goalId } });
  return goal !== null && goal.userId === ctx.userId;
}

// ─── GoalHabit ────────────────────────────────────────────────────────────────

export async function applyGoalHabits(ctx: PushContext, raws: GoalHabitRaw[]): Promise<void> {
  for (const raw of raws) {
    if (!(await goalBelongsToUser(ctx, raw.goal_id))) continue;

    const habit = await ctx.tx.habit.findUnique({ where: { id: raw.habit_id } });
    if (!habit || habit.userId !== ctx.userId) continue;

    let krId = raw.kr_id ?? null;
    if (krId) {
      const kr = await ctx.tx.keyResult.findUnique({ where: { id: krId } });
      if (!kr || kr.goalId !== raw.goal_id) krId = null;
    }

    const existing = await ctx.tx.goalHabit.findUnique({ where: { id: raw.id } });
    try {
      if (existing) {
        await ctx.tx.goalHabit.update({ where: { id: raw.id }, data: { krId } });
      } else {
        await ctx.tx.goalHabit.create({
          data: { id: raw.id, goalId: raw.goal_id, habitId: raw.habit_id, krId },
        });
      }
    } catch (error) {
      // (goalId, habitId) único: el link ya existe con otro id (creado por web)
      if (isUniqueViolation(error)) {
        logger.warn(`[replication] goal_habit ${raw.id} duplicado (goal/habit): ignorado`);
        continue;
      }
      throw error;
    }
  }
}

export async function deleteGoalHabits(ctx: PushContext, ids: string[]): Promise<void> {
  for (const id of ids) {
    const existing = await ctx.tx.goalHabit.findUnique({
      where: { id },
      include: { goal: { select: { userId: true } } },
    });
    if (!existing) {
      await recordTombstones(ctx.tx, ctx.userId, 'goal_habits', [id]);
      continue;
    }
    if (existing.goal.userId !== ctx.userId) continue;
    await recordTombstones(ctx.tx, ctx.userId, 'goal_habits', [id]);
    await ctx.tx.goalHabit.delete({ where: { id } });
  }
}

// ─── GoalTask ─────────────────────────────────────────────────────────────────

export async function applyGoalTasks(ctx: PushContext, raws: GoalTaskRaw[]): Promise<void> {
  for (const raw of raws) {
    if (!(await goalBelongsToUser(ctx, raw.goal_id))) continue;

    const task = await ctx.tx.task.findUnique({ where: { id: raw.task_id } });
    if (!task || task.userId !== ctx.userId) continue;

    const existing = await ctx.tx.goalTask.findUnique({ where: { id: raw.id } });
    if (existing) continue; // sin campos mutables

    try {
      await ctx.tx.goalTask.create({
        data: { id: raw.id, goalId: raw.goal_id, taskId: raw.task_id },
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        logger.warn(`[replication] goal_task ${raw.id} duplicado (goal/task): ignorado`);
        continue;
      }
      throw error;
    }
  }
}

export async function deleteGoalTasks(ctx: PushContext, ids: string[]): Promise<void> {
  for (const id of ids) {
    const existing = await ctx.tx.goalTask.findUnique({
      where: { id },
      include: { goal: { select: { userId: true } } },
    });
    if (!existing) {
      await recordTombstones(ctx.tx, ctx.userId, 'goal_tasks', [id]);
      continue;
    }
    if (existing.goal.userId !== ctx.userId) continue;
    await recordTombstones(ctx.tx, ctx.userId, 'goal_tasks', [id]);
    await ctx.tx.goalTask.delete({ where: { id } });
  }
}
