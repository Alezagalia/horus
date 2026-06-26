import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../lib/prisma.js', () => {
  const tx = {
    transaction: { deleteMany: vi.fn() },
    monthlyExpenseInstance: { deleteMany: vi.fn() },
    savingsGoal: { deleteMany: vi.fn() },
    habit: { deleteMany: vi.fn() },
    task: { deleteMany: vi.fn() },
    event: { deleteMany: vi.fn() },
    workout: { deleteMany: vi.fn() },
    routine: { deleteMany: vi.fn() },
    recipe: { deleteMany: vi.fn() },
    user: { delete: vi.fn() },
  };
  return {
    prisma: {
      __tx: tx,
      $transaction: vi.fn(async (cb: (t: typeof tx) => Promise<void>) => cb(tx)),
    },
  };
});

import { deleteAccount } from './accountDeletion.service.js';
import { prisma } from '../lib/prisma.js';

const tx = (
  prisma as unknown as {
    __tx: Record<
      string,
      { deleteMany?: ReturnType<typeof vi.fn>; delete?: ReturnType<typeof vi.fn> }
    >;
  }
).__tx;

describe('deleteAccount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('runs inside a single transaction', async () => {
    await deleteAccount('u1');
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('deletes Restrict-referencing children before deleting the user', async () => {
    const order: string[] = [];
    for (const [name, model] of Object.entries(tx)) {
      const fn = model.deleteMany ?? model.delete!;
      fn.mockImplementation(async () => {
        order.push(name);
      });
    }

    await deleteAccount('u1');

    // Every child delete must come before the final user.delete.
    expect(order[order.length - 1]).toBe('user');
    for (const child of ['transaction', 'habit', 'task', 'event', 'workout', 'routine', 'recipe']) {
      expect(order.indexOf(child)).toBeLessThan(order.indexOf('user'));
    }
  });

  it('scopes every child deletion to the user', async () => {
    await deleteAccount('u1');
    expect(tx.transaction.deleteMany).toHaveBeenCalledWith({ where: { userId: 'u1' } });
    expect(tx.habit.deleteMany).toHaveBeenCalledWith({ where: { userId: 'u1' } });
    expect(tx.user.delete).toHaveBeenCalledWith({ where: { id: 'u1' } });
  });
});
