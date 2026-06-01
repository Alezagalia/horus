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
import { debiaRealizarseEnFecha } from './streak.service.js';
import { normalizeToUTCNoon } from '../utils/date.utils.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseWeekStart(weekStartStr: string): Date {
  // Anclar a medianoche UTC del lunes. Las fechas de transacciones/hábitos se guardan como
  // medianoche UTC del día (date-only), así que la ventana debe usar el mismo anclaje.
  // Se usa UTC explícito (no la TZ del server) para que sea consistente en cualquier entorno.
  const d = new Date(weekStartStr);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function getWeekEnd(weekStart: Date): Date {
  const end = new Date(weekStart);
  end.setUTCDate(end.getUTCDate() + 6);
  end.setUTCHours(23, 59, 59, 999);
  return end;
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export const getWeekStats = async (userId: string, weekStartStr: string) => {
  const weekStart = parseWeekStart(weekStartStr);
  const weekEnd = getWeekEnd(weekStart);

  const [habitRecords, activeHabits, completedTasks, transactions, goals, events, totalEvents] =
    await Promise.all([
      prisma.habitRecord.count({
        where: { userId, date: { gte: weekStart, lte: weekEnd }, completed: true },
      }),
      prisma.habit.findMany({
        where: { userId, isActive: true },
        select: { id: true, periodicity: true, weekDays: true, createdAt: true },
      }),
      prisma.task.count({
        where: { userId, isActive: true, completedAt: { gte: weekStart, lte: weekEnd } },
      }),
      prisma.transaction.findMany({
        // isTransfer: false → las transferencias entre cuentas no son ingresos/egresos
        where: { userId, isTransfer: false, date: { gte: weekStart, lte: weekEnd } },
        select: { type: true, amount: true, account: { select: { currency: true } } },
      }),
      prisma.goal.findMany({
        where: { userId, isActive: true, status: 'en_progreso' },
        include: {
          goalHabits: { select: { habitId: true } },
          goalTasks: { include: { task: { select: { completedAt: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.event.count({
        where: { userId, status: 'completado', startDateTime: { gte: weekStart, lte: weekEnd } },
      }),
      prisma.event.count({
        where: { userId, startDateTime: { gte: weekStart, lte: weekEnd } },
      }),
    ]);

  // Finanzas POR MONEDA: nunca se suman ARS + USD (cada moneda es su propio bucket).
  const financeMap = new Map<
    string,
    { currency: string; income: number; expenses: number; balance: number }
  >();
  for (const tx of transactions) {
    const currency = tx.account?.currency ?? 'ARS';
    const bucket = financeMap.get(currency) ?? { currency, income: 0, expenses: 0, balance: 0 };
    const amount = Number(tx.amount);
    if (tx.type === 'ingreso') bucket.income += amount;
    else bucket.expenses += amount;
    bucket.balance = bucket.income - bucket.expenses;
    financeMap.set(currency, bucket);
  }
  const byCurrency = Array.from(financeMap.values()).sort((a, b) => b.balance - a.balance);

  // Completaciones esperadas de la semana, respetando periodicidad y fecha de alta de
  // cada hábito (en vez del naive hábitos × 7, que subestimaba los no-diarios).
  let possible = 0;
  for (const habit of activeHabits) {
    const createdAtNoon = normalizeToUTCNoon(habit.createdAt);
    for (let i = 0; i < 7; i++) {
      const day = normalizeToUTCNoon(new Date(weekStart.getTime() + i * 24 * 60 * 60 * 1000));
      if (day.getTime() < createdAtNoon.getTime()) continue;
      if (debiaRealizarseEnFecha(habit, day)) possible++;
    }
  }
  const habitRate = possible > 0 ? Math.min(Math.round((habitRecords / possible) * 100), 100) : 0;

  // Progreso de metas ACOTADO a la semana seleccionada (no a "últimos 7 días desde hoy").
  const linkedHabitIds = goals.flatMap((g) => g.goalHabits.map((gh) => gh.habitId));
  const weekHabitRecords = linkedHabitIds.length
    ? await prisma.habitRecord.findMany({
        where: {
          userId,
          completed: true,
          date: { gte: weekStart, lte: weekEnd },
          habitId: { in: linkedHabitIds },
        },
        select: { habitId: true },
        distinct: ['habitId'],
      })
    : [];
  const completedHabitIds = new Set(weekHabitRecords.map((r) => r.habitId));

  const goalsWithProgress = goals.map((g) => {
    const completedTasksCount = g.goalTasks.filter(
      (gt) =>
        gt.task.completedAt && gt.task.completedAt >= weekStart && gt.task.completedAt <= weekEnd
    ).length;
    const completedHabitsCount = g.goalHabits.filter((gh) =>
      completedHabitIds.has(gh.habitId)
    ).length;
    const total = g.goalTasks.length + g.goalHabits.length;
    const progress =
      total > 0 ? Math.round(((completedTasksCount + completedHabitsCount) / total) * 100) : 0;
    return { id: g.id, title: g.title, progress, status: g.status };
  });

  return {
    weekStart: weekStart.toISOString(),
    weekEnd: weekEnd.toISOString(),
    habits: { completed: habitRecords, total: activeHabits.length, possible, rate: habitRate },
    tasks: { completed: completedTasks },
    finance: { byCurrency },
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

const DEFAULT_REVIEW_QUESTIONS = [
  '¿Qué salió bien esta semana?',
  '¿Qué no salió como esperabas?',
  '¿Qué aprendiste?',
  '¿Cuál es tu foco para la próxima semana?',
];

export const listQuestions = async (userId: string) => {
  // Sembrar preguntas por defecto la primera vez (solo si el usuario nunca tuvo ninguna,
  // así no se re-crean si las borró a propósito).
  const total = await prisma.reviewQuestion.count({ where: { userId } });
  if (total === 0) {
    await prisma.reviewQuestion.createMany({
      data: DEFAULT_REVIEW_QUESTIONS.map((text, i) => ({ userId, text, order: i })),
    });
  }

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
