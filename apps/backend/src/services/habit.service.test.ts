import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../lib/prisma.js', () => {
  const mockPrisma = {
    habit: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
    },
    habitRecord: { findFirst: vi.fn(), findMany: vi.fn(), upsert: vi.fn(), count: vi.fn() },
    habitAudit: { create: vi.fn(), createMany: vi.fn() },
    category: { findFirst: vi.fn(), findMany: vi.fn() },
    $transaction: vi.fn(),
  };
  // Default: pass mock to callback
  mockPrisma.$transaction.mockImplementation((fnOrArray: unknown) => {
    if (typeof fnOrArray === 'function')
      return (fnOrArray as (tx: typeof mockPrisma) => unknown)(mockPrisma);
    return Promise.all(fnOrArray as Promise<unknown>[]);
  });
  return { prisma: mockPrisma };
});

import { prisma } from '../lib/prisma.js';
import { habitService } from './habit.service.js';
import { NotFoundError } from '../middlewares/error.middleware.js';

const p = vi.mocked(prisma);

const USER_ID = 'user-1';
const HABIT_ID = 'habit-1';
const CAT_ID = 'cat-1';

const mockHabit = {
  id: HABIT_ID,
  userId: USER_ID,
  categoryId: CAT_ID,
  name: 'Meditar',
  description: null,
  type: 'CHECK',
  targetValue: null,
  unit: null,
  periodicity: 'DAILY',
  weekDays: [1, 2, 3, 4, 5],
  timeOfDay: 'morning',
  reminderTime: null,
  color: null,
  order: 0,
  isActive: true,
  currentStreak: 0,
  longestStreak: 0,
  lastCompletedDate: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  category: { id: CAT_ID, name: 'Salud', icon: '🏃', color: '#ff0', scope: 'habitos' },
};

beforeEach(() => {
  vi.clearAllMocks();
  p.$transaction.mockImplementation((fnOrArray: unknown) => {
    if (typeof fnOrArray === 'function') return (fnOrArray as (tx: typeof p) => unknown)(p);
    return Promise.all(fnOrArray as Promise<unknown>[]);
  });
});

describe('habitService.findAll', () => {
  it('returns habits for user', async () => {
    p.habit.findMany.mockResolvedValue([mockHabit] as any);

    const result = await habitService.findAll(USER_ID);

    expect(result).toHaveLength(1);
    expect(p.habit.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: USER_ID, isActive: true }),
      })
    );
  });

  it('filters by categoryId when provided', async () => {
    p.habit.findMany.mockResolvedValue([mockHabit] as any);

    await habitService.findAll(USER_ID, CAT_ID);

    expect(p.habit.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ categoryId: CAT_ID }) })
    );
  });

  it('returns habits with records when date is provided', async () => {
    p.habit.findMany.mockResolvedValue([mockHabit] as any);
    p.habitRecord.findMany.mockResolvedValue([]);

    const result = await habitService.findAll(USER_ID, undefined, '2026-06-01');

    expect(p.habitRecord.findMany).toHaveBeenCalled();
    expect(result[0]).toHaveProperty('records');
  });
});

describe('habitService.findById', () => {
  it('returns habit when found', async () => {
    p.habit.findFirst.mockResolvedValue(mockHabit as any);
    const result = await habitService.findById(HABIT_ID, USER_ID);
    expect(result).toEqual(mockHabit);
  });

  it('throws NotFoundError when habit not found', async () => {
    p.habit.findFirst.mockResolvedValue(null);
    await expect(habitService.findById('non-existent', USER_ID)).rejects.toThrow(NotFoundError);
  });
});

describe('habitService.create', () => {
  const createData = {
    categoryId: CAT_ID,
    name: 'Meditar',
    type: 'CHECK' as const,
    periodicity: 'DAILY' as const,
    weekDays: [1, 2, 3, 4, 5],
    timeOfDay: 'morning',
    order: 0,
  };

  it('creates habit and audit log in transaction', async () => {
    p.category.findFirst.mockResolvedValue({ id: CAT_ID, userId: USER_ID, isActive: true } as any);
    p.$transaction.mockImplementation(async (fn: (tx: any) => unknown) => {
      const tx = {
        habit: { create: vi.fn().mockResolvedValue(mockHabit) },
        habitAudit: { create: vi.fn().mockResolvedValue({}) },
      };
      return fn(tx);
    });

    const result = await habitService.create(USER_ID, createData);
    expect(result).toEqual(mockHabit);
  });

  it('throws NotFoundError when category does not exist', async () => {
    p.category.findFirst.mockResolvedValue(null);
    await expect(habitService.create(USER_ID, createData)).rejects.toThrow(NotFoundError);
  });
});

describe('habitService.update', () => {
  it('updates habit and creates audit logs', async () => {
    p.habit.findFirst.mockResolvedValue(mockHabit as any);
    p.$transaction.mockImplementation(async (fn: (tx: any) => unknown) => {
      const tx = {
        habit: { update: vi.fn().mockResolvedValue({ ...mockHabit, name: 'Updated' }) },
        habitAudit: { createMany: vi.fn().mockResolvedValue({}) },
      };
      return fn(tx);
    });

    const result = await habitService.update(HABIT_ID, USER_ID, { name: 'Updated' });
    expect(result).toHaveProperty('name', 'Updated');
  });

  it('throws NotFoundError when habit does not exist', async () => {
    p.habit.findFirst.mockResolvedValue(null);
    await expect(habitService.update('bad-id', USER_ID, { name: 'X' })).rejects.toThrow(
      NotFoundError
    );
  });
});

describe('habitService.delete', () => {
  it('soft-deletes habit', async () => {
    p.habit.findFirst.mockResolvedValue(mockHabit as any);
    p.$transaction.mockImplementation(async (fn: (tx: any) => unknown) => {
      const tx = {
        habit: { update: vi.fn().mockResolvedValue({ ...mockHabit, isActive: false }) },
        habitAudit: { create: vi.fn().mockResolvedValue({}) },
      };
      return fn(tx);
    });

    const result = await habitService.delete(HABIT_ID, USER_ID);
    expect(result).toHaveProperty('isActive', false);
  });

  it('throws NotFoundError when habit does not exist', async () => {
    p.habit.findFirst.mockResolvedValue(null);
    await expect(habitService.delete('bad-id', USER_ID)).rejects.toThrow(NotFoundError);
  });
});
