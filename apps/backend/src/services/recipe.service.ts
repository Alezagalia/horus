/**
 * Recipe Service - F-17 Sprint 1
 */

import { prisma } from '../lib/prisma.js';
import { ConflictError, NotFoundError, ForbiddenError } from '../middlewares/error.middleware.js';
import { assertOwnership } from '../lib/ownership.js';
import type { CreateRecipeInput, UpdateRecipeInput, MacroTotals } from '@horus/shared';

export function calcMacrosForAmount(
  food: { calories: unknown; protein: unknown; carbs: unknown; fat: unknown; fiber: unknown },
  grams: number
): MacroTotals {
  const factor = grams / 100;
  return {
    calories: Number(food.calories) * factor,
    protein: Number(food.protein) * factor,
    carbs: Number(food.carbs) * factor,
    fat: Number(food.fat) * factor,
    fiber: food.fiber != null ? Number(food.fiber) * factor : 0,
  };
}

function sumMacros(macros: MacroTotals[]): MacroTotals {
  return macros.reduce(
    (acc, m) => ({
      calories: acc.calories + m.calories,
      protein: acc.protein + m.protein,
      carbs: acc.carbs + m.carbs,
      fat: acc.fat + m.fat,
      fiber: acc.fiber + m.fiber,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );
}

const includeIngredients = {
  ingredients: {
    include: { food: true },
  },
};

function serializeRecipe(
  recipe: Awaited<ReturnType<typeof prisma.recipe.findFirst>> & {
    ingredients?: Array<{
      id: string;
      recipeId: string;
      foodId: string;
      grams: unknown;
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
      };
    }>;
  }
) {
  if (!recipe) return null;

  const ingredients = (recipe.ingredients ?? []).map((ing) => ({
    id: ing.id,
    recipeId: ing.recipeId,
    foodId: ing.foodId,
    grams: Number(ing.grams),
    notes: ing.notes,
    food: {
      ...ing.food,
      calories: Number(ing.food.calories),
      protein: Number(ing.food.protein),
      carbs: Number(ing.food.carbs),
      fat: Number(ing.food.fat),
      fiber: ing.food.fiber != null ? Number(ing.food.fiber) : null,
      createdAt: ing.food.createdAt.toISOString(),
      updatedAt: ing.food.updatedAt.toISOString(),
    },
  }));

  const totalMacros = sumMacros(ingredients.map((ing) => calcMacrosForAmount(ing.food, ing.grams)));

  const macrosPerServing: MacroTotals =
    recipe.servings > 0
      ? {
          calories: totalMacros.calories / recipe.servings,
          protein: totalMacros.protein / recipe.servings,
          carbs: totalMacros.carbs / recipe.servings,
          fat: totalMacros.fat / recipe.servings,
          fiber: totalMacros.fiber / recipe.servings,
        }
      : totalMacros;

  return {
    id: recipe.id,
    userId: recipe.userId,
    name: recipe.name,
    description: recipe.description,
    servings: recipe.servings,
    isActive: recipe.isActive,
    createdAt: recipe.createdAt.toISOString(),
    updatedAt: recipe.updatedAt.toISOString(),
    ingredients,
    macrosPerServing,
  };
}

export const recipeService = {
  async findAll(userId: string) {
    const recipes = await prisma.recipe.findMany({
      where: { userId, isActive: true },
      orderBy: { name: 'asc' },
      include: includeIngredients,
    });

    return recipes.map(serializeRecipe).filter(Boolean);
  },

  async findById(id: string, userId: string) {
    const recipe = await prisma.recipe.findFirst({
      where: { id },
      include: includeIngredients,
    });

    if (!recipe) throw new NotFoundError('Receta no encontrada');
    if (recipe.userId !== userId) throw new ForbiddenError('Sin permiso');

    return serializeRecipe(recipe);
  },

  async create(userId: string, data: CreateRecipeInput) {
    const existing = await prisma.recipe.findFirst({
      where: { userId, name: data.name },
    });

    if (existing) {
      throw new ConflictError(`Ya existe una receta llamada "${data.name}"`);
    }

    await assertOwnership(
      'food',
      (data.ingredients ?? []).map((ing) => ing.foodId),
      userId
    );

    const recipe = await prisma.recipe.create({
      data: {
        userId,
        name: data.name,
        description: data.description ?? null,
        servings: data.servings ?? 1,
        ingredients: {
          create: (data.ingredients ?? []).map((ing) => ({
            foodId: ing.foodId,
            grams: ing.grams,
            notes: ing.notes ?? null,
          })),
        },
      },
      include: includeIngredients,
    });

    return serializeRecipe(recipe);
  },

  async update(id: string, userId: string, data: UpdateRecipeInput) {
    const recipe = await prisma.recipe.findFirst({ where: { id } });

    if (!recipe) throw new NotFoundError('Receta no encontrada');
    if (recipe.userId !== userId) throw new ForbiddenError('Sin permiso');

    if (data.name && data.name !== recipe.name) {
      const existing = await prisma.recipe.findFirst({ where: { userId, name: data.name } });
      if (existing) throw new ConflictError(`Ya existe una receta llamada "${data.name}"`);
    }

    const updated = await prisma.recipe.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description !== undefined ? data.description : undefined,
        servings: data.servings,
        isActive: data.isActive,
      },
      include: includeIngredients,
    });

    return serializeRecipe(updated);
  },

  async delete(id: string, userId: string) {
    const recipe = await prisma.recipe.findFirst({ where: { id } });

    if (!recipe) throw new NotFoundError('Receta no encontrada');
    if (recipe.userId !== userId) throw new ForbiddenError('Sin permiso');

    await prisma.recipe.update({ where: { id }, data: { isActive: false } });
  },

  async addIngredient(
    recipeId: string,
    userId: string,
    data: { foodId: string; grams: number; notes?: string | null }
  ) {
    const recipe = await prisma.recipe.findFirst({ where: { id: recipeId } });

    if (!recipe) throw new NotFoundError('Receta no encontrada');
    if (recipe.userId !== userId) throw new ForbiddenError('Sin permiso');

    await assertOwnership('food', [data.foodId], userId);

    const existing = await prisma.recipeIngredient.findFirst({
      where: { recipeId, foodId: data.foodId },
    });

    if (existing) throw new ConflictError('Este alimento ya es un ingrediente de la receta');

    await prisma.recipeIngredient.create({
      data: {
        recipeId,
        foodId: data.foodId,
        grams: data.grams,
        notes: data.notes ?? null,
      },
    });

    return recipeService.findById(recipeId, userId);
  },

  async removeIngredient(recipeId: string, ingredientId: string, userId: string) {
    const recipe = await prisma.recipe.findFirst({ where: { id: recipeId } });

    if (!recipe) throw new NotFoundError('Receta no encontrada');
    if (recipe.userId !== userId) throw new ForbiddenError('Sin permiso');

    const ingredient = await prisma.recipeIngredient.findFirst({
      where: { id: ingredientId, recipeId },
    });

    if (!ingredient) throw new NotFoundError('Ingrediente no encontrado');

    await prisma.recipeIngredient.delete({ where: { id: ingredientId } });
  },
};
