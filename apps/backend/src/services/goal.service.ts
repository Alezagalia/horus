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

// ─── Progress Calculation ─────────────────────────────────────────────────────

function calculateProgress(
  goalTasks: Array<{ task: { status: string } }>,
  goalHabits: Array<{ habit: { lastCompletedDate: Date | null } }>
): number {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const completedTasks = goalTasks.filter((gt) => gt.task.status === 'completada').length;
  const completedHabits = goalHabits.filter(
    (gh) => gh.habit.lastCompletedDate && new Date(gh.habit.lastCompletedDate) >= sevenDaysAgo
  ).length;
  const total = goalTasks.length + goalHabits.length;
  return total > 0 ? Math.round(((completedTasks + completedHabits) / total) * 100) : 0;
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
          habit: { select: { id: true, name: true, color: true, lastCompletedDate: true } },
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
    progress: calculateProgress(g.goalTasks, g.goalHabits),
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
            select: { id: true, name: true, color: true, lastCompletedDate: true },
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
    progress: calculateProgress(goal.goalTasks, goal.goalHabits),
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
    progress: calculateProgress(goal.goalTasks, goal.goalHabits),
    linkedHabitsCount: goal.goalHabits.length,
    linkedTasksCount: goal.goalTasks.length,
  };
};

export const deleteGoal = async (goalId: string, userId: string) => {
  const existing = await prisma.goal.findFirst({ where: { id: goalId, userId } });
  if (!existing) throw new Error('Meta no encontrada');
  return prisma.goal.update({ where: { id: goalId }, data: { isActive: false } });
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

export const linkHabit = async (goalId: string, userId: string, habitId: string) => {
  const goal = await prisma.goal.findFirst({ where: { id: goalId, userId, isActive: true } });
  if (!goal) throw new Error('Meta no encontrada');

  const habit = await prisma.habit.findFirst({ where: { id: habitId, userId, isActive: true } });
  if (!habit) throw new Error('Hábito no encontrado');

  return prisma.goalHabit.upsert({
    where: { goalId_habitId: { goalId, habitId } },
    create: { goalId, habitId },
    update: {},
  });
};

export const unlinkHabit = async (goalId: string, userId: string, habitId: string) => {
  const goal = await prisma.goal.findFirst({ where: { id: goalId, userId, isActive: true } });
  if (!goal) throw new Error('Meta no encontrada');

  await prisma.goalHabit.deleteMany({ where: { goalId, habitId } });
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

  await prisma.goalTask.deleteMany({ where: { goalId, taskId } });
};
