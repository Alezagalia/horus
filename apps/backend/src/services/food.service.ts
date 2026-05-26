/**
 * Food Service - F-17 Sprint 1
 */

import { prisma } from '../lib/prisma.js';
import { ConflictError, NotFoundError, ForbiddenError } from '../middlewares/error.middleware.js';
import type { CreateFoodInput, UpdateFoodInput, FoodFiltersInput } from '@horus/shared';

export const foodService = {
  async findAll(userId: string, filters?: FoodFiltersInput) {
    const where: {
      userId: string;
      isActive?: boolean;
      name?: { contains: string; mode: 'insensitive' };
    } = { userId };

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    } else {
      where.isActive = true;
    }

    if (filters?.search) {
      where.name = { contains: filters.search, mode: 'insensitive' };
    }

    const foods = await prisma.food.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return foods.map(serializeFood);
  },

  async findById(id: string, userId: string) {
    const food = await prisma.food.findFirst({ where: { id } });

    if (!food) throw new NotFoundError('Alimento no encontrado');
    if (food.userId !== userId) throw new ForbiddenError('Sin permiso');

    return serializeFood(food);
  },

  async create(userId: string, data: CreateFoodInput) {
    const existing = await prisma.food.findFirst({
      where: { userId, name: data.name },
    });

    if (existing) {
      throw new ConflictError(`Ya existe un alimento llamado "${data.name}"`);
    }

    const food = await prisma.food.create({
      data: {
        userId,
        name: data.name,
        brand: data.brand ?? null,
        calories: data.calories,
        protein: data.protein,
        carbs: data.carbs,
        fat: data.fat,
        fiber: data.fiber ?? null,
        unit: data.unit ?? 'g',
      },
    });

    return serializeFood(food);
  },

  async update(id: string, userId: string, data: UpdateFoodInput) {
    const food = await prisma.food.findFirst({ where: { id } });

    if (!food) throw new NotFoundError('Alimento no encontrado');
    if (food.userId !== userId) throw new ForbiddenError('Sin permiso');

    if (data.name && data.name !== food.name) {
      const existing = await prisma.food.findFirst({
        where: { userId, name: data.name },
      });
      if (existing) throw new ConflictError(`Ya existe un alimento llamado "${data.name}"`);
    }

    const updated = await prisma.food.update({
      where: { id },
      data: {
        name: data.name,
        brand: data.brand !== undefined ? data.brand : undefined,
        calories: data.calories,
        protein: data.protein,
        carbs: data.carbs,
        fat: data.fat,
        fiber: data.fiber !== undefined ? data.fiber : undefined,
        unit: data.unit,
        isActive: data.isActive,
      },
    });

    return serializeFood(updated);
  },

  async delete(id: string, userId: string) {
    const food = await prisma.food.findFirst({ where: { id } });

    if (!food) throw new NotFoundError('Alimento no encontrado');
    if (food.userId !== userId) throw new ForbiddenError('Sin permiso');

    await prisma.food.update({ where: { id }, data: { isActive: false } });
  },
};

function serializeFood(food: {
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
}) {
  return {
    ...food,
    calories: Number(food.calories),
    protein: Number(food.protein),
    carbs: Number(food.carbs),
    fat: Number(food.fat),
    fiber: food.fiber != null ? Number(food.fiber) : null,
    createdAt: food.createdAt.toISOString(),
    updatedAt: food.updatedAt.toISOString(),
  };
}
