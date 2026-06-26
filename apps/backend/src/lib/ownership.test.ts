import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('./prisma.js', () => ({
  prisma: {
    food: { count: vi.fn() },
    recipe: { count: vi.fn() },
    exercise: { count: vi.fn() },
    goal: { count: vi.fn() },
    task: { count: vi.fn() },
    reviewQuestion: { count: vi.fn() },
    mealPlan: { count: vi.fn() },
  },
}));

import { assertOwnership } from './ownership.js';
import { ForbiddenError } from '../middlewares/error.middleware.js';
import { prisma } from './prisma.js';

const p = vi.mocked(prisma, true);
const USER = 'user-1';

describe('assertOwnership', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('passes when every id belongs to the user', async () => {
    p.food.count.mockResolvedValue(2);
    await expect(assertOwnership('food', ['a', 'b'], USER)).resolves.toBeUndefined();
    expect(p.food.count).toHaveBeenCalledWith({ where: { id: { in: ['a', 'b'] }, userId: USER } });
  });

  it('throws ForbiddenError when an id is missing or belongs to another user', async () => {
    // Two distinct ids requested but only one is owned by the user.
    p.goal.count.mockResolvedValue(1);
    await expect(assertOwnership('goal', ['mine', 'someone-elses'], USER)).rejects.toBeInstanceOf(
      ForbiddenError
    );
  });

  it('ignores null/undefined ids and de-duplicates before counting', async () => {
    p.task.count.mockResolvedValue(1);
    await assertOwnership('task', ['x', 'x', null, undefined], USER);
    expect(p.task.count).toHaveBeenCalledWith({ where: { id: { in: ['x'] }, userId: USER } });
  });

  it('is a no-op (no DB call) when there are no real ids', async () => {
    await expect(assertOwnership('food', [null, undefined], USER)).resolves.toBeUndefined();
    expect(p.food.count).not.toHaveBeenCalled();
  });
});
