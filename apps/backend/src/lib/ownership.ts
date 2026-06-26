import { prisma } from './prisma.js';
import { ForbiddenError } from '../middlewares/error.middleware.js';

/**
 * Models whose rows are owned by a single user via a `userId` column and that
 * are referenced by foreign keys coming from the request body. Used to prevent
 * IDOR: a user must not be able to attach another user's resource (a food,
 * recipe, exercise, goal, task or review question) to one of their own.
 */
type OwnableModel =
  | 'food'
  | 'recipe'
  | 'exercise'
  | 'goal'
  | 'task'
  | 'reviewQuestion'
  | 'mealPlan';

interface CountableByUser {
  count(args: { where: { id: { in: string[] }; userId: string } }): Promise<number>;
}

const delegates: Record<OwnableModel, CountableByUser> = {
  food: prisma.food as unknown as CountableByUser,
  recipe: prisma.recipe as unknown as CountableByUser,
  exercise: prisma.exercise as unknown as CountableByUser,
  goal: prisma.goal as unknown as CountableByUser,
  task: prisma.task as unknown as CountableByUser,
  reviewQuestion: prisma.reviewQuestion as unknown as CountableByUser,
  mealPlan: prisma.mealPlan as unknown as CountableByUser,
};

/**
 * Asserts that every non-null id in `ids` references a row of `model` owned by
 * `userId`. Throws ForbiddenError if any id is missing or belongs to someone
 * else. Null/undefined/duplicate ids are ignored; an empty set is a no-op.
 */
export async function assertOwnership(
  model: OwnableModel,
  ids: Array<string | null | undefined>,
  userId: string
): Promise<void> {
  const unique = [...new Set(ids.filter((id): id is string => Boolean(id)))];
  if (unique.length === 0) return;

  const count = await delegates[model].count({
    where: { id: { in: unique }, userId },
  });

  if (count !== unique.length) {
    throw new ForbiddenError(`Referencia a un ${model} que no pertenece al usuario`);
  }
}
