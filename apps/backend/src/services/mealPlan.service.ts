/**
 * MealPlan Service - F-17 Sprint 2
 */

import { prisma } from '../lib/prisma.js';
import { NotFoundError, ForbiddenError } from '../middlewares/error.middleware.js';
import { calcMacrosForAmount } from './recipe.service.js';
import type {
  CreateMealPlanInput,
  AddMealEntryInput,
  MacroTotals,
  MealTime,
  DayMacros,
} from '@horus/shared';

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

const includeEntries = {
  entries: {
    orderBy: [{ day: 'asc' as const }, { mealTime: 'asc' as const }],
    include: {
      items: {
        include: {
          food: true,
          recipe: {
            include: {
              ingredients: { include: { food: true } },
            },
          },
        },
      },
    },
  },
};

function serializePlan(
  plan: Awaited<ReturnType<typeof prisma.mealPlan.findFirst>> & {
    entries?: unknown[];
  }
) {
  if (!plan) return null;

  const entries = ((plan as { entries?: unknown[] }).entries ?? []).map((entry: unknown) => {
    const e = entry as {
      id: string;
      mealPlanId: string;
      day: Date;
      mealTime: string;
      notes: string | null;
      items: Array<{
        id: string;
        mealEntryId: string;
        foodId: string | null;
        recipeId: string | null;
        grams: unknown;
        servings: unknown;
        food: {
          calories: unknown;
          protein: unknown;
          carbs: unknown;
          fat: unknown;
          fiber: unknown;
          [key: string]: unknown;
        } | null;
        recipe: {
          id: string;
          servings: number;
          ingredients: Array<{
            grams: unknown;
            food: {
              calories: unknown;
              protein: unknown;
              carbs: unknown;
              fat: unknown;
              fiber: unknown;
            };
          }>;
          [key: string]: unknown;
        } | null;
      }>;
    };

    const items = e.items.map((item) => {
      let macros = { ...EMPTY_MACROS };
      const gramsVal = Number(item.grams);

      if (item.food) {
        macros = calcMacrosForAmount(item.food, gramsVal);
      } else if (item.recipe) {
        const recipeTotalMacros = item.recipe.ingredients.reduce(
          (acc, ing) => {
            return addMacros(acc, calcMacrosForAmount(ing.food, Number(ing.grams)));
          },
          { ...EMPTY_MACROS }
        );

        const servings = item.servings != null ? Number(item.servings) : 1;
        macros = {
          calories: (recipeTotalMacros.calories / item.recipe.servings) * servings,
          protein: (recipeTotalMacros.protein / item.recipe.servings) * servings,
          carbs: (recipeTotalMacros.carbs / item.recipe.servings) * servings,
          fat: (recipeTotalMacros.fat / item.recipe.servings) * servings,
          fiber: (recipeTotalMacros.fiber / item.recipe.servings) * servings,
        };
      }

      return {
        id: item.id,
        mealEntryId: item.mealEntryId,
        foodId: item.foodId,
        recipeId: item.recipeId,
        food: item.food,
        recipe: item.recipe,
        grams: gramsVal,
        servings: item.servings != null ? Number(item.servings) : null,
        macros,
      };
    });

    const entryMacros = items.reduce((acc, item) => addMacros(acc, item.macros), {
      ...EMPTY_MACROS,
    });

    return {
      id: e.id,
      mealPlanId: e.mealPlanId,
      day: typeof e.day === 'string' ? e.day : (e.day as Date).toISOString().split('T')[0],
      mealTime: e.mealTime,
      notes: e.notes,
      items,
      macros: entryMacros,
    };
  });

  return {
    id: plan.id,
    userId: plan.userId,
    weekStart:
      typeof plan.weekStart === 'string'
        ? plan.weekStart
        : (plan.weekStart as Date).toISOString().split('T')[0],
    notes: plan.notes,
    createdAt: (plan.createdAt as Date).toISOString(),
    updatedAt: (plan.updatedAt as Date).toISOString(),
    entries,
  };
}

export const mealPlanService = {
  async findAll(userId: string) {
    const plans = await prisma.mealPlan.findMany({
      where: { userId },
      orderBy: { weekStart: 'desc' },
    });

    return plans.map((p) => ({
      id: p.id,
      userId: p.userId,
      weekStart: (p.weekStart as Date).toISOString().split('T')[0],
      notes: p.notes,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }));
  },

  async findById(id: string, userId: string) {
    const plan = await prisma.mealPlan.findFirst({
      where: { id },
      include: includeEntries,
    });

    if (!plan) throw new NotFoundError('Plan no encontrado');
    if (plan.userId !== userId) throw new ForbiddenError('Sin permiso');

    return serializePlan(plan as Parameters<typeof serializePlan>[0]);
  },

  async findByWeek(userId: string, weekStart: string) {
    const plan = await prisma.mealPlan.findFirst({
      where: { userId, weekStart: new Date(weekStart) },
      include: includeEntries,
    });

    if (!plan) return null;
    return serializePlan(plan as Parameters<typeof serializePlan>[0]);
  },

  async create(userId: string, data: CreateMealPlanInput) {
    const plan = await prisma.mealPlan.upsert({
      where: { userId_weekStart: { userId, weekStart: new Date(data.weekStart) } },
      update: { notes: data.notes ?? null },
      create: {
        userId,
        weekStart: new Date(data.weekStart),
        notes: data.notes ?? null,
      },
    });

    return mealPlanService.findById(plan.id, userId);
  },

  async delete(id: string, userId: string) {
    const plan = await prisma.mealPlan.findFirst({ where: { id } });

    if (!plan) throw new NotFoundError('Plan no encontrado');
    if (plan.userId !== userId) throw new ForbiddenError('Sin permiso');

    await prisma.mealPlan.delete({ where: { id } });
  },

  async addEntry(mealPlanId: string, userId: string, data: AddMealEntryInput) {
    const plan = await prisma.mealPlan.findFirst({ where: { id: mealPlanId } });

    if (!plan) throw new NotFoundError('Plan no encontrado');
    if (plan.userId !== userId) throw new ForbiddenError('Sin permiso');

    await prisma.mealEntry.create({
      data: {
        mealPlanId,
        day: new Date(data.day),
        mealTime: data.mealTime,
        notes: data.notes ?? null,
        items: {
          create: data.items.map((item) => ({
            foodId: item.foodId ?? null,
            recipeId: item.recipeId ?? null,
            grams: item.grams,
            servings: item.servings ?? null,
          })),
        },
      },
    });

    return mealPlanService.findById(mealPlanId, userId);
  },

  async deleteEntry(mealPlanId: string, entryId: string, userId: string) {
    const plan = await prisma.mealPlan.findFirst({ where: { id: mealPlanId } });

    if (!plan) throw new NotFoundError('Plan no encontrado');
    if (plan.userId !== userId) throw new ForbiddenError('Sin permiso');

    const entry = await prisma.mealEntry.findFirst({
      where: { id: entryId, mealPlanId },
    });

    if (!entry) throw new NotFoundError('Entrada no encontrada');

    await prisma.mealEntry.delete({ where: { id: entryId } });
  },

  async getDayMacros(mealPlanId: string, userId: string): Promise<DayMacros[]> {
    const plan = await mealPlanService.findById(mealPlanId, userId);
    if (!plan) throw new NotFoundError('Plan no encontrado');

    const dayMap = new Map<string, DayMacros>();

    for (const entry of plan.entries) {
      const day = entry.day;
      if (!dayMap.has(day)) {
        dayMap.set(day, {
          day,
          macros: { ...EMPTY_MACROS },
          byMealTime: {} as Record<MealTime, MacroTotals>,
        });
      }

      const dayData = dayMap.get(day)!;
      dayData.macros = addMacros(dayData.macros, entry.macros);
      dayData.byMealTime[entry.mealTime as MealTime] = addMacros(
        dayData.byMealTime[entry.mealTime as MealTime] ?? { ...EMPTY_MACROS },
        entry.macros
      );
    }

    return Array.from(dayMap.values()).sort((a, b) => a.day.localeCompare(b.day));
  },
};
