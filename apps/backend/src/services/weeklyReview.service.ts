/**
 * Weekly Review Service (F-03)
 * Revisión Semanal / Check-in
 */

import { prisma } from '../lib/prisma.js';
import {
  CreateReviewInput,
  UpdateReviewInput,
  CreateQuestionInput,
  UpdateQuestionInput,
} from '../validations/weeklyReview.validation.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getWeekEnd(weekStart: Date): Date {
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

function parseWeekStart(weekStartStr: string): Date {
  const d = new Date(weekStartStr);
  d.setHours(0, 0, 0, 0);
  return d;
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export const getWeekStats = async (userId: string, weekStartStr: string) => {
  const weekStart = parseWeekStart(weekStartStr);
  const weekEnd = getWeekEnd(weekStart);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [habitRecords, activeHabits, completedTasks, transactions, goals, events, totalEvents] =
    await Promise.all([
      prisma.habitRecord.count({
        where: { userId, date: { gte: weekStart, lte: weekEnd }, completed: true },
      }),
      prisma.habit.count({ where: { userId, isActive: true } }),
      prisma.task.count({
        where: { userId, isActive: true, completedAt: { gte: weekStart, lte: weekEnd } },
      }),
      prisma.transaction.findMany({
        where: { userId, date: { gte: weekStart, lte: weekEnd } },
        select: { type: true, amount: true },
      }),
      prisma.goal.findMany({
        where: { userId, isActive: true, status: 'en_progreso' },
        include: {
          goalHabits: { include: { habit: { select: { lastCompletedDate: true } } } },
          goalTasks: { include: { task: { select: { status: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.event.count({
        where: { userId, status: 'completado', startDate: { gte: weekStart, lte: weekEnd } },
      }),
      prisma.event.count({
        where: { userId, startDate: { gte: weekStart, lte: weekEnd } },
      }),
    ]);

  let income = 0;
  let expenses = 0;
  for (const tx of transactions) {
    const amount = Number(tx.amount);
    if (tx.type === 'ingreso') income += amount;
    else expenses += amount;
  }

  const goalsWithProgress = goals.map((g) => {
    const completedTasksCount = g.goalTasks.filter((gt) => gt.task.status === 'completada').length;
    const completedHabitsCount = g.goalHabits.filter(
      (gh) => gh.habit.lastCompletedDate && new Date(gh.habit.lastCompletedDate) >= sevenDaysAgo
    ).length;
    const total = g.goalTasks.length + g.goalHabits.length;
    const progress =
      total > 0 ? Math.round(((completedTasksCount + completedHabitsCount) / total) * 100) : 0;
    return { id: g.id, title: g.title, progress, status: g.status };
  });

  const habitRate =
    activeHabits > 0 ? Math.min(Math.round((habitRecords / (activeHabits * 7)) * 100), 100) : 0;

  return {
    weekStart: weekStart.toISOString(),
    weekEnd: weekEnd.toISOString(),
    habits: { completed: habitRecords, total: activeHabits, rate: habitRate },
    tasks: { completed: completedTasks },
    finance: { income, expenses, balance: income - expenses },
    goals: goalsWithProgress,
    events: { completed: events, total: totalEvents },
  };
};

// ─── Reviews ──────────────────────────────────────────────────────────────────

const reviewInclude = {
  answers: {
    include: {
      question: { select: { id: true, text: true, order: true } },
    },
  },
  focusGoals: {
    include: {
      goal: { select: { id: true, title: true, status: true, priority: true } },
    },
  },
  focusTasks: {
    include: {
      task: { select: { id: true, title: true, status: true, priority: true } },
    },
  },
} as const;

export const getOrCreateReview = async (userId: string, weekStartStr: string) => {
  const weekStart = parseWeekStart(weekStartStr);
  const weekEnd = getWeekEnd(weekStart);

  return prisma.weeklyReview.upsert({
    where: { userId_weekStart: { userId, weekStart } },
    create: { userId, weekStart, weekEnd },
    update: {},
    include: reviewInclude,
  });
};

export const listReviews = async (userId: string, limit = 20) => {
  return prisma.weeklyReview.findMany({
    where: { userId },
    include: reviewInclude,
    orderBy: { weekStart: 'desc' },
    take: limit,
  });
};

export const createReview = async (userId: string, data: CreateReviewInput) => {
  const weekStart = parseWeekStart(data.weekStart);
  const weekEnd = getWeekEnd(weekStart);

  return prisma.weeklyReview.upsert({
    where: { userId_weekStart: { userId, weekStart } },
    create: { userId, weekStart, weekEnd },
    update: {},
    include: reviewInclude,
  });
};

export const updateReview = async (reviewId: string, userId: string, data: UpdateReviewInput) => {
  const existing = await prisma.weeklyReview.findFirst({ where: { id: reviewId, userId } });
  if (!existing) throw new Error('Revisión no encontrada');

  let statsSnapshot = undefined;
  if (data.completedAt) {
    statsSnapshot = await getWeekStats(userId, existing.weekStart.toISOString());
  }

  await prisma.$transaction(async (tx) => {
    if (data.answers) {
      for (const ans of data.answers) {
        await tx.weeklyReviewAnswer.upsert({
          where: { reviewId_questionId: { reviewId, questionId: ans.questionId } },
          create: { reviewId, questionId: ans.questionId, answer: ans.answer },
          update: { answer: ans.answer },
        });
      }
    }

    if (data.focusGoalIds !== undefined) {
      await tx.weeklyReviewFocusGoal.deleteMany({ where: { reviewId } });
      if (data.focusGoalIds.length > 0) {
        await tx.weeklyReviewFocusGoal.createMany({
          data: data.focusGoalIds.map((goalId) => ({ reviewId, goalId })),
          skipDuplicates: true,
        });
      }
    }

    if (data.focusTaskIds !== undefined) {
      await tx.weeklyReviewFocusTask.deleteMany({ where: { reviewId } });
      if (data.focusTaskIds.length > 0) {
        await tx.weeklyReviewFocusTask.createMany({
          data: data.focusTaskIds.map((taskId) => ({ reviewId, taskId })),
          skipDuplicates: true,
        });
      }
    }

    await tx.weeklyReview.update({
      where: { id: reviewId },
      data: {
        ...(data.completedAt !== undefined && {
          completedAt: data.completedAt ? new Date(data.completedAt) : null,
        }),
        ...(statsSnapshot !== undefined && { statsSnapshot }),
      },
    });
  });

  return prisma.weeklyReview.findFirst({ where: { id: reviewId }, include: reviewInclude });
};

// ─── Questions ────────────────────────────────────────────────────────────────

export const listQuestions = async (userId: string) => {
  return prisma.reviewQuestion.findMany({
    where: { userId, isActive: true },
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
  });
};

export const createQuestion = async (userId: string, data: CreateQuestionInput) => {
  return prisma.reviewQuestion.create({
    data: { userId, text: data.text, order: data.order ?? 0 },
  });
};

export const updateQuestion = async (
  questionId: string,
  userId: string,
  data: UpdateQuestionInput
) => {
  const existing = await prisma.reviewQuestion.findFirst({ where: { id: questionId, userId } });
  if (!existing) throw new Error('Pregunta no encontrada');

  return prisma.reviewQuestion.update({
    where: { id: questionId },
    data: {
      ...(data.text !== undefined && { text: data.text }),
      ...(data.order !== undefined && { order: data.order }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  });
};

export const deleteQuestion = async (questionId: string, userId: string) => {
  const existing = await prisma.reviewQuestion.findFirst({ where: { id: questionId, userId } });
  if (!existing) throw new Error('Pregunta no encontrada');
  return prisma.reviewQuestion.update({ where: { id: questionId }, data: { isActive: false } });
};
