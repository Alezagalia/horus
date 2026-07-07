/**
 * Goal Service
 * F-02 - Metas y Objetivos (Goals + OKRs)
 *
 * Business logic for Goals CRUD, Key Results, and habit/task linking.
 */

import { Scope, Priority, GoalStatus } from '../generated/prisma/client.js';
import {
  CreateGoalInput,
  UpdateGoalInput,
  CreateKeyResultInput,
  UpdateKeyResultInput,
} from '../validations/goal.validation.js';
import { prisma } from '../lib/prisma.js';
import { recordTombstones } from './replication/tombstone.service.js';

// ─── Progress Calculation ─────────────────────────────────────────────────────

/**
 * Progreso calculado en 2 niveles:
 * 1. Si hay KRs activos → promedio de (currentValue / targetValue) por KR (0–100)
 * 2. Fallback sin KRs  → ratio de tareas completadas (o 0 si tampoco hay tareas)
 */
function calculateProgress(
  keyResults: Array<{ targetValue: unknown; currentValue: unknown; isActive: boolean }>,
  goalTasks: Array<{ task: { status: string } }>
): number {
  const activeKRs = keyResults.filter((kr) => kr.isActive);

  if (activeKRs.length > 0) {
    const avg =
      activeKRs.reduce((sum, kr) => {
        const target = Number(kr.targetValue);
        const current = Number(kr.currentValue);
        return sum + (target > 0 ? Math.min(current / target, 1) : 0);
      }, 0) / activeKRs.length;
    return Math.round(avg * 100);
  }

  if (goalTasks.length > 0) {
    const done = goalTasks.filter((gt) => gt.task.status === 'completada').length;
    return Math.round((done / goalTasks.length) * 100);
  }

  return 0;
}

// ─── Goal CRUD ────────────────────────────────────────────────────────────────

export const listGoals = async (userId: string, status?: string) => {
  const goals = await prisma.goal.findMany({
    where: {
      userId,
      isActive: true,
      ...(status ? { status: status as GoalStatus } : {}),
    },
    include: {
      category: { select: { id: true, name: true, icon: true, color: true } },
      keyResults: { where: { isActive: true }, orderBy: { createdAt: 'asc' } },
      goalHabits: {
        include: {
          habit: {
            select: { id: true, name: true, type: true, color: true, lastCompletedDate: true },
          },
        },
      },
      goalTasks: {
        include: {
          task: { select: { id: true, title: true, status: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return goals.map((g) => ({
    ...g,
    keyResults: g.keyResults.map((kr) => ({
      ...kr,
      targetValue: Number(kr.targetValue),
      currentValue: Number(kr.currentValue),
    })),
    progress: calculateProgress(g.keyResults, g.goalTasks),
    linkedHabitsCount: g.goalHabits.length,
    linkedTasksCount: g.goalTasks.length,
  }));
};

export const getGoalById = async (goalId: string, userId: string) => {
  const goal = await prisma.goal.findFirst({
    where: { id: goalId, userId, isActive: true },
    include: {
      category: { select: { id: true, name: true, icon: true, color: true } },
      keyResults: { where: { isActive: true }, orderBy: { createdAt: 'asc' } },
      goalHabits: {
        include: {
          habit: {
            select: { id: true, name: true, type: true, color: true, lastCompletedDate: true },
          },
        },
      },
      goalTasks: {
        include: {
          task: { select: { id: true, title: true, status: true, priority: true, dueDate: true } },
        },
      },
    },
  });

  if (!goal) throw new Error('Meta no encontrada');

  return {
    ...goal,
    keyResults: goal.keyResults.map((kr) => ({
      ...kr,
      targetValue: Number(kr.targetValue),
      currentValue: Number(kr.currentValue),
    })),
    progress: calculateProgress(goal.keyResults, goal.goalTasks),
    linkedHabitsCount: goal.goalHabits.length,
    linkedTasksCount: goal.goalTasks.length,
  };
};

export const createGoal = async (userId: string, data: CreateGoalInput) => {
  if (data.categoryId) {
    const category = await prisma.category.findFirst({
      where: { id: data.categoryId, userId, isActive: true, scope: Scope.metas },
    });
    if (!category) {
      throw new Error('La categoría no existe o no es de tipo "metas"');
    }
  }

  const goal = await prisma.goal.create({
    data: {
      userId,
      title: data.title,
      description: data.description,
      categoryId: data.categoryId,
      priority: (data.priority as Priority) ?? Priority.media,
      targetDate: data.targetDate ? new Date(data.targetDate) : undefined,
    },
    include: {
      category: { select: { id: true, name: true, icon: true, color: true } },
      keyResults: { where: { isActive: true } },
    },
  });

  return {
    ...goal,
    keyResults: goal.keyResults.map((kr) => ({
      ...kr,
      targetValue: Number(kr.targetValue),
      currentValue: Number(kr.currentValue),
    })),
    progress: 0,
    linkedHabitsCount: 0,
    linkedTasksCount: 0,
  };
};

export const updateGoal = async (goalId: string, userId: string, data: UpdateGoalInput) => {
  const existing = await prisma.goal.findFirst({ where: { id: goalId, userId } });
  if (!existing) throw new Error('Meta no encontrada');

  if (data.categoryId) {
    const category = await prisma.category.findFirst({
      where: { id: data.categoryId, userId, isActive: true, scope: Scope.metas },
    });
    if (!category) {
      throw new Error('La categoría no existe o no es de tipo "metas"');
    }
  }

  const completedAt =
    data.status === 'completada' && existing.status !== 'completada' ? new Date() : undefined;

  const goal = await prisma.goal.update({
    where: { id: goalId },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
      ...(data.priority !== undefined && { priority: data.priority as Priority }),
      ...(data.targetDate !== undefined && {
        targetDate: data.targetDate ? new Date(data.targetDate) : null,
      }),
      ...(data.status !== undefined && { status: data.status as GoalStatus }),
      ...(completedAt && { completedAt }),
    },
    include: {
      category: { select: { id: true, name: true, icon: true, color: true } },
      keyResults: { where: { isActive: true } },
      goalHabits: {
        include: { habit: { select: { lastCompletedDate: true } } },
      },
      goalTasks: {
        include: { task: { select: { status: true } } },
      },
    },
  });

  return {
    ...goal,
    keyResults: goal.keyResults.map((kr) => ({
      ...kr,
      targetValue: Number(kr.targetValue),
      currentValue: Number(kr.currentValue),
    })),
    progress: calculateProgress(goal.keyResults, goal.goalTasks),
    linkedHabitsCount: goal.goalHabits.length,
    linkedTasksCount: goal.goalTasks.length,
  };
};

export const deleteGoal = async (goalId: string, userId: string) => {
  const existing = await prisma.goal.findFirst({ where: { id: goalId, userId } });
  if (!existing) throw new Error('Meta no encontrada');
  return prisma.goal.update({ where: { id: goalId }, data: { isActive: false } });
};

export const featureGoal = async (goalId: string, userId: string) => {
  const existing = await prisma.goal.findFirst({ where: { id: goalId, userId, isActive: true } });
  if (!existing) throw new Error('Meta no encontrada');

  const newFeatured = !existing.isFeatured;

  // Unfeature all goals for this user first
  await prisma.goal.updateMany({ where: { userId }, data: { isFeatured: false } });

  // Toggle featured on this goal
  return prisma.goal.update({ where: { id: goalId }, data: { isFeatured: newFeatured } });
};

export const getFeaturedGoal = async (userId: string) => {
  const goal = await prisma.goal.findFirst({
    where: { userId, isActive: true, isFeatured: true },
    include: {
      category: { select: { id: true, name: true, icon: true, color: true } },
      keyResults: { where: { isActive: true }, orderBy: { createdAt: 'asc' } },
      goalHabits: {
        include: {
          habit: { select: { id: true, name: true, color: true, lastCompletedDate: true } },
        },
      },
      goalTasks: {
        include: { task: { select: { id: true, title: true, status: true } } },
      },
    },
  });

  if (!goal) return null;

  return {
    ...goal,
    keyResults: goal.keyResults.map((kr) => ({
      ...kr,
      targetValue: Number(kr.targetValue),
      currentValue: Number(kr.currentValue),
    })),
    progress: calculateProgress(goal.keyResults, goal.goalTasks),
    linkedHabitsCount: goal.goalHabits.length,
    linkedTasksCount: goal.goalTasks.length,
  };
};

// ─── Key Results ──────────────────────────────────────────────────────────────

export const createKeyResult = async (
  goalId: string,
  userId: string,
  data: CreateKeyResultInput
) => {
  const goal = await prisma.goal.findFirst({ where: { id: goalId, userId, isActive: true } });
  if (!goal) throw new Error('Meta no encontrada');

  const kr = await prisma.keyResult.create({
    data: {
      goalId,
      title: data.title,
      targetValue: data.targetValue,
      currentValue: data.currentValue ?? 0,
      unit: data.unit,
    },
  });

  return { ...kr, targetValue: Number(kr.targetValue), currentValue: Number(kr.currentValue) };
};

export const updateKeyResult = async (
  krId: string,
  goalId: string,
  userId: string,
  data: UpdateKeyResultInput
) => {
  const goal = await prisma.goal.findFirst({ where: { id: goalId, userId, isActive: true } });
  if (!goal) throw new Error('Meta no encontrada');

  const existing = await prisma.keyResult.findFirst({ where: { id: krId, goalId } });
  if (!existing) throw new Error('Key Result no encontrado');

  const kr = await prisma.keyResult.update({
    where: { id: krId },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.targetValue !== undefined && { targetValue: data.targetValue }),
      ...(data.currentValue !== undefined && { currentValue: data.currentValue }),
      ...(data.unit !== undefined && { unit: data.unit }),
    },
  });

  return { ...kr, targetValue: Number(kr.targetValue), currentValue: Number(kr.currentValue) };
};

export const deleteKeyResult = async (krId: string, goalId: string, userId: string) => {
  const goal = await prisma.goal.findFirst({ where: { id: goalId, userId, isActive: true } });
  if (!goal) throw new Error('Meta no encontrada');

  const existing = await prisma.keyResult.findFirst({ where: { id: krId, goalId } });
  if (!existing) throw new Error('Key Result no encontrado');

  return prisma.keyResult.update({ where: { id: krId }, data: { isActive: false } });
};

// ─── Link / Unlink Habits ─────────────────────────────────────────────────────

export const linkHabit = async (goalId: string, userId: string, habitId: string, krId?: string) => {
  const goal = await prisma.goal.findFirst({ where: { id: goalId, userId, isActive: true } });
  if (!goal) throw new Error('Meta no encontrada');

  const habit = await prisma.habit.findFirst({ where: { id: habitId, userId, isActive: true } });
  if (!habit) throw new Error('Hábito no encontrado');

  if (krId) {
    const kr = await prisma.keyResult.findFirst({ where: { id: krId, goalId, isActive: true } });
    if (!kr) throw new Error('Key Result no encontrado');
  }

  return prisma.goalHabit.upsert({
    where: { goalId_habitId: { goalId, habitId } },
    create: { goalId, habitId, krId: krId ?? null },
    update: { krId: krId ?? null },
  });
};

export const unlinkHabit = async (goalId: string, userId: string, habitId: string) => {
  const goal = await prisma.goal.findFirst({ where: { id: goalId, userId, isActive: true } });
  if (!goal) throw new Error('Meta no encontrada');

  // Hard delete + tombstone para la replicación offline
  await prisma.$transaction(async (tx) => {
    const links = await tx.goalHabit.findMany({ where: { goalId, habitId }, select: { id: true } });
    if (links.length > 0) {
      await recordTombstones(
        tx,
        userId,
        'goal_habits',
        links.map((l) => l.id)
      );
    }
    await tx.goalHabit.deleteMany({ where: { goalId, habitId } });
  });
};

// ─── Link / Unlink Tasks ──────────────────────────────────────────────────────

export const linkTask = async (goalId: string, userId: string, taskId: string) => {
  const goal = await prisma.goal.findFirst({ where: { id: goalId, userId, isActive: true } });
  if (!goal) throw new Error('Meta no encontrada');

  const task = await prisma.task.findFirst({ where: { id: taskId, userId, isActive: true } });
  if (!task) throw new Error('Tarea no encontrada');

  return prisma.goalTask.upsert({
    where: { goalId_taskId: { goalId, taskId } },
    create: { goalId, taskId },
    update: {},
  });
};

export const unlinkTask = async (goalId: string, userId: string, taskId: string) => {
  const goal = await prisma.goal.findFirst({ where: { id: goalId, userId, isActive: true } });
  if (!goal) throw new Error('Meta no encontrada');

  // Hard delete + tombstone para la replicación offline
  await prisma.$transaction(async (tx) => {
    const links = await tx.goalTask.findMany({ where: { goalId, taskId }, select: { id: true } });
    if (links.length > 0) {
      await recordTombstones(
        tx,
        userId,
        'goal_tasks',
        links.map((l) => l.id)
      );
    }
    await tx.goalTask.deleteMany({ where: { goalId, taskId } });
  });
};
