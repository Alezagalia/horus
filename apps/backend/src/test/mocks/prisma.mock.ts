import { vi } from 'vitest';

/**
 * Creates a fresh Prisma mock for use in vi.hoisted() + vi.mock() pattern.
 *
 * Usage in test files:
 *   const prismaMock = vi.hoisted(() => createPrismaMock());
 *   vi.mock('../../lib/prisma.js', () => ({ prisma: prismaMock }));
 */
export function createPrismaMock() {
  const mock = {
    habit: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
    },
    habitRecord: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn(),
      count: vi.fn(),
      createMany: vi.fn(),
    },
    habitAudit: {
      create: vi.fn(),
      createMany: vi.fn(),
    },
    task: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    goal: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    goalHabit: {
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
    goalTask: {
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
    keyResult: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    category: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
    },
    weeklyReview: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
    reviewQuestion: {
      findMany: vi.fn(),
    },
    weeklyReviewAnswer: {
      findMany: vi.fn(),
    },
    transaction: {
      findMany: vi.fn(),
    },
    event: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    $transaction: vi.fn(),
  };

  // Default $transaction implementation: pass the mock itself to the callback
  mock.$transaction.mockImplementation((fnOrArray: unknown) => {
    if (typeof fnOrArray === 'function') {
      return fnOrArray(mock);
    }
    // Array of promises (batch)
    return Promise.all(fnOrArray as Promise<unknown>[]);
  });

  return mock;
}
