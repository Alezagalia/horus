/**
 * ShoppingList Service - F-17 Sprint 3
 */

import { prisma } from '../lib/prisma.js';
import { NotFoundError, ForbiddenError, ConflictError } from '../middlewares/error.middleware.js';
import { assertOwnership } from '../lib/ownership.js';
import type { CreateShoppingListInput } from '@horus/shared';

const includeItems = {
  items: {
    orderBy: { name: 'asc' as const },
    include: { food: true },
  },
};

function serializeList(
  list: Awaited<ReturnType<typeof prisma.shoppingList.findFirst>> & {
    items?: Array<{
      id: string;
      shoppingListId: string;
      foodId: string | null;
      name: string;
      quantity: unknown;
      unit: string;
      checked: boolean;
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
  if (!list) return null;

  const items = (list.items ?? []).map((item) => ({
    id: item.id,
    shoppingListId: item.shoppingListId,
    foodId: item.foodId,
    name: item.name,
    quantity: Number(item.quantity),
    unit: item.unit,
    checked: item.checked,
    notes: item.notes,
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
  }));

  return {
    id: list.id,
    userId: list.userId,
    mealPlanId: list.mealPlanId,
    name: list.name,
    transactionId: list.transactionId,
    generatedAt: list.generatedAt ? list.generatedAt.toISOString() : null,
    createdAt: (list.createdAt as Date).toISOString(),
    updatedAt: (list.updatedAt as Date).toISOString(),
    items,
  };
}

export const shoppingListService = {
  async findAll(userId: string) {
    const lists = await prisma.shoppingList.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: includeItems,
    });

    return lists
      .map((l) => serializeList(l as Parameters<typeof serializeList>[0]))
      .filter(Boolean);
  },

  async findById(id: string, userId: string) {
    const list = await prisma.shoppingList.findFirst({
      where: { id },
      include: includeItems,
    });

    if (!list) throw new NotFoundError('Lista no encontrada');
    if (list.userId !== userId) throw new ForbiddenError('Sin permiso');

    return serializeList(list as Parameters<typeof serializeList>[0]);
  },

  async create(userId: string, data: CreateShoppingListInput) {
    await assertOwnership('mealPlan', [data.mealPlanId], userId);
    await assertOwnership(
      'food',
      (data.items ?? []).map((item) => item.foodId),
      userId
    );

    const list = await prisma.shoppingList.create({
      data: {
        userId,
        name: data.name,
        mealPlanId: data.mealPlanId ?? null,
        items: {
          create: (data.items ?? []).map((item) => ({
            foodId: item.foodId ?? null,
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            notes: item.notes ?? null,
          })),
        },
      },
      include: includeItems,
    });

    return serializeList(list as Parameters<typeof serializeList>[0]);
  },

  async update(id: string, userId: string, data: { name?: string }) {
    const list = await prisma.shoppingList.findFirst({ where: { id } });

    if (!list) throw new NotFoundError('Lista no encontrada');
    if (list.userId !== userId) throw new ForbiddenError('Sin permiso');

    const updated = await prisma.shoppingList.update({
      where: { id },
      data: { name: data.name },
      include: includeItems,
    });

    return serializeList(updated as Parameters<typeof serializeList>[0]);
  },

  async delete(id: string, userId: string) {
    const list = await prisma.shoppingList.findFirst({ where: { id } });

    if (!list) throw new NotFoundError('Lista no encontrada');
    if (list.userId !== userId) throw new ForbiddenError('Sin permiso');

    await prisma.shoppingList.delete({ where: { id } });
  },

  async checkItem(listId: string, itemId: string, userId: string, checked: boolean) {
    const list = await prisma.shoppingList.findFirst({ where: { id: listId } });

    if (!list) throw new NotFoundError('Lista no encontrada');
    if (list.userId !== userId) throw new ForbiddenError('Sin permiso');

    const item = await prisma.shoppingListItem.findFirst({
      where: { id: itemId, shoppingListId: listId },
    });

    if (!item) throw new NotFoundError('Ítem no encontrado');

    await prisma.shoppingListItem.update({
      where: { id: itemId },
      data: { checked },
    });

    return shoppingListService.findById(listId, userId);
  },

  async generateFromMealPlan(mealPlanId: string, userId: string, name: string) {
    const plan = await prisma.mealPlan.findFirst({
      where: { id: mealPlanId },
      include: {
        entries: {
          include: {
            items: {
              include: {
                food: true,
                recipe: {
                  include: { ingredients: { include: { food: true } } },
                },
              },
            },
          },
        },
      },
    });

    if (!plan) throw new NotFoundError('Plan no encontrado');
    if (plan.userId !== userId) throw new ForbiddenError('Sin permiso');

    // Aggregate grams per food
    const foodMap = new Map<
      string,
      { food: { id: string; name: string; unit: string }; totalGrams: number }
    >();

    for (const entry of plan.entries) {
      for (const item of entry.items) {
        if (item.food) {
          const existing = foodMap.get(item.food.id);
          if (existing) {
            existing.totalGrams += Number(item.grams);
          } else {
            foodMap.set(item.food.id, {
              food: { id: item.food.id, name: item.food.name, unit: item.food.unit },
              totalGrams: Number(item.grams),
            });
          }
        }

        if (item.recipe) {
          const servings = item.servings != null ? Number(item.servings) : 1;
          const recipeServings = item.recipe.servings;

          for (const ing of item.recipe.ingredients) {
            const gramsForServings = (Number(ing.grams) / recipeServings) * servings;
            const existing = foodMap.get(ing.food.id);
            if (existing) {
              existing.totalGrams += gramsForServings;
            } else {
              foodMap.set(ing.food.id, {
                food: { id: ing.food.id, name: ing.food.name, unit: ing.food.unit },
                totalGrams: gramsForServings,
              });
            }
          }
        }
      }
    }

    const list = await prisma.shoppingList.create({
      data: {
        userId,
        mealPlanId,
        name,
        generatedAt: new Date(),
        items: {
          create: Array.from(foodMap.values()).map(({ food, totalGrams }) => ({
            foodId: food.id,
            name: food.name,
            quantity: Math.ceil(totalGrams),
            unit: food.unit,
          })),
        },
      },
      include: includeItems,
    });

    return serializeList(list as Parameters<typeof serializeList>[0]);
  },

  async syncFromMealPlan(mealPlanId: string, userId: string) {
    const plan = await prisma.mealPlan.findFirst({
      where: { id: mealPlanId },
      include: {
        entries: {
          include: {
            items: {
              include: {
                food: true,
                recipe: {
                  include: { ingredients: { include: { food: true } } },
                },
              },
            },
          },
        },
      },
    });

    if (!plan) throw new NotFoundError('Plan no encontrado');
    if (plan.userId !== userId) throw new ForbiddenError('Sin permiso');

    // Aggregate grams per food (same logic as generateFromMealPlan)
    const foodMap = new Map<
      string,
      { food: { id: string; name: string; unit: string }; totalGrams: number }
    >();

    for (const entry of plan.entries) {
      for (const item of entry.items) {
        if (item.food) {
          const existing = foodMap.get(item.food.id);
          if (existing) {
            existing.totalGrams += Number(item.grams);
          } else {
            foodMap.set(item.food.id, {
              food: { id: item.food.id, name: item.food.name, unit: item.food.unit },
              totalGrams: Number(item.grams),
            });
          }
        }

        if (item.recipe) {
          const servings = item.servings != null ? Number(item.servings) : 1;
          const recipeServings = item.recipe.servings;
          for (const ing of item.recipe.ingredients) {
            const gramsForServings = (Number(ing.grams) / recipeServings) * servings;
            const existing = foodMap.get(ing.food.id);
            if (existing) {
              existing.totalGrams += gramsForServings;
            } else {
              foodMap.set(ing.food.id, {
                food: { id: ing.food.id, name: ing.food.name, unit: ing.food.unit },
                totalGrams: gramsForServings,
              });
            }
          }
        }
      }
    }

    const newItems = Array.from(foodMap.values()).map(({ food, totalGrams }) => ({
      foodId: food.id,
      name: food.name,
      quantity: Math.ceil(totalGrams),
      unit: food.unit,
    }));

    const existingList = await prisma.shoppingList.findFirst({
      where: { mealPlanId, userId },
    });

    if (existingList) {
      await prisma.shoppingListItem.deleteMany({ where: { shoppingListId: existingList.id } });
      const updated = await prisma.shoppingList.update({
        where: { id: existingList.id },
        data: {
          generatedAt: new Date(),
          items: { create: newItems },
        },
        include: includeItems,
      });
      return serializeList(updated as Parameters<typeof serializeList>[0]);
    } else {
      const weekStart =
        plan.weekStart instanceof Date
          ? plan.weekStart.toISOString().split('T')[0]
          : String(plan.weekStart);
      const list = await prisma.shoppingList.create({
        data: {
          userId,
          mealPlanId,
          name: `Compras semana ${weekStart}`,
          generatedAt: new Date(),
          items: { create: newItems },
        },
        include: includeItems,
      });
      return serializeList(list as Parameters<typeof serializeList>[0]);
    }
  },

  async linkTransaction(listId: string, userId: string, transactionId: string) {
    const list = await prisma.shoppingList.findFirst({ where: { id: listId } });

    if (!list) throw new NotFoundError('Lista no encontrada');
    if (list.userId !== userId) throw new ForbiddenError('Sin permiso');

    // Verify transaction belongs to user
    const tx = await prisma.transaction.findFirst({ where: { id: transactionId, userId } });
    if (!tx) throw new NotFoundError('Transacción no encontrada');

    // Check if transaction is already linked to another list
    const existing = await prisma.shoppingList.findFirst({
      where: { transactionId, id: { not: listId } },
    });
    if (existing) throw new ConflictError('Esta transacción ya está vinculada a otra lista');

    const updated = await prisma.shoppingList.update({
      where: { id: listId },
      data: { transactionId },
      include: includeItems,
    });

    return serializeList(updated as Parameters<typeof serializeList>[0]);
  },
};
