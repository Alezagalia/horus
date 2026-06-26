/**
 * NutritionLog Service - F-17 Sprint 3
 */

import { prisma } from '../lib/prisma.js';
import { NotFoundError, ForbiddenError } from '../middlewares/error.middleware.js';
import { assertOwnership } from '../lib/ownership.js';
import { calcMacrosForAmount } from './recipe.service.js';
import type { UpsertNutritionLogInput, MacroTotals } from '@horus/shared';

const EMPTY_MACROS: MacroTotals = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };

function addMacros(a: MacroTotals, b: MacroTotals): MacroTotals {
  return {
    calories: a.calories + b.calories,
    protein: a.protein + b.protein,
    carbs: a.carbs + b.carbs,
    fat: a.fat + b.fat,
    fiber: a.fiber + b.fiber,
  };
}

const includeItems = {
  items: {
    orderBy: { mealTime: 'asc' as const },
    include: { food: true },
  },
};

function serializeLog(
  log: Awaited<ReturnType<typeof prisma.nutritionLog.findFirst>> & {
    items?: Array<{
      id: string;
      nutritionLogId: string;
      foodId: string | null;
      mealTime: string;
      grams: unknown;
      servings: unknown;
      notes: string | null;
      food: {
        id: string;
        userId: string;
        name: string;
        brand: string | null;
        calories: unknown;
        protein: unknown;
        carbs: unknown;
        fat: unknown;
        fiber: unknown;
        unit: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
      } | null;
    }>;
  }
) {
  if (!log) return null;

  const items = (log.items ?? []).map((item) => {
    const grams = Number(item.grams);
    const macros = item.food ? calcMacrosForAmount(item.food, grams) : { ...EMPTY_MACROS };

    return {
      id: item.id,
      nutritionLogId: item.nutritionLogId,
      foodId: item.foodId,
      mealTime: item.mealTime,
      grams,
      servings: item.servings != null ? Number(item.servings) : null,
      notes: item.notes,
      macros,
      food: item.food
        ? {
            ...item.food,
            calories: Number(item.food.calories),
            protein: Number(item.food.protein),
            carbs: Number(item.food.carbs),
            fat: Number(item.food.fat),
            fiber: item.food.fiber != null ? Number(item.food.fiber) : null,
            createdAt: item.food.createdAt.toISOString(),
            updatedAt: item.food.updatedAt.toISOString(),
          }
        : null,
    };
  });

  const dayMacros = items.reduce((acc, item) => addMacros(acc, item.macros), { ...EMPTY_MACROS });

  return {
    id: log.id,
    userId: log.userId,
    date: typeof log.date === 'string' ? log.date : (log.date as Date).toISOString().split('T')[0],
    notes: log.notes,
    items,
    dayMacros,
    createdAt: (log.createdAt as Date).toISOString(),
    updatedAt: (log.updatedAt as Date).toISOString(),
  };
}

export const nutritionLogService = {
  async findByDateRange(userId: string, from?: string, to?: string) {
    const where: { userId: string; date?: { gte?: Date; lte?: Date } } = { userId };

    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to);
    }

    const logs = await prisma.nutritionLog.findMany({
      where,
      orderBy: { date: 'desc' },
      include: includeItems,
    });

    return logs.map((l) => serializeLog(l as Parameters<typeof serializeLog>[0])).filter(Boolean);
  },

  async findByDate(userId: string, date: string) {
    const log = await prisma.nutritionLog.findFirst({
      where: { userId, date: new Date(date) },
      include: includeItems,
    });

    return log ? serializeLog(log as Parameters<typeof serializeLog>[0]) : null;
  },

  async upsert(userId: string, date: string, data: UpsertNutritionLogInput) {
    const dateObj = new Date(date);

    await assertOwnership(
      'food',
      (data.items ?? []).map((item) => item.foodId),
      userId
    );

    await prisma.nutritionLog.upsert({
      where: { userId_date: { userId, date: dateObj } },
      create: {
        userId,
        date: dateObj,
        notes: data.notes ?? null,
        items: {
          create: (data.items ?? []).map((item) => ({
            foodId: item.foodId ?? null,
            mealTime: item.mealTime,
            grams: item.grams,
            servings: item.servings ?? null,
            notes: item.notes ?? null,
          })),
        },
      },
      update: {
        notes: data.notes !== undefined ? data.notes : undefined,
        ...(data.items !== undefined && {
          items: {
            deleteMany: {},
            create: data.items.map((item) => ({
              foodId: item.foodId ?? null,
              mealTime: item.mealTime,
              grams: item.grams,
              servings: item.servings ?? null,
              notes: item.notes ?? null,
            })),
          },
        }),
      },
    });

    return nutritionLogService.findByDate(userId, date);
  },

  async delete(userId: string, date: string) {
    const log = await prisma.nutritionLog.findFirst({
      where: { userId, date: new Date(date) },
    });

    if (!log) throw new NotFoundError('Registro no encontrado');
    if (log.userId !== userId) throw new ForbiddenError('Sin permiso');

    await prisma.nutritionLog.delete({ where: { id: log.id } });
  },
};
