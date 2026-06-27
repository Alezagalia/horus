import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    habitRecord: { count: vi.fn(), findMany: vi.fn() },
    habit: { findMany: vi.fn() },
    task: { count: vi.fn() },
    transaction: { findMany: vi.fn() },
    goal: { findMany: vi.fn() },
    event: { count: vi.fn() },
    weeklyReview: {
      upsert: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

vi.mock('./streak.service.js', () => ({
  debiaRealizarseEnFecha: vi.fn().mockReturnValue(true),
}));

import { prisma } from '../lib/prisma.js';
import { getWeekStats, getOrCreateReview, createReview } from './weeklyReview.service.js';

const p = vi.mocked(prisma, true);

const USER_ID = 'user-1';
const WEEK_START = '2026-05-25'; // Monday

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getWeekStats', () => {
  beforeEach(() => {
    p.habitRecord.count.mockResolvedValue(5);
    p.habit.findMany.mockResolvedValue([
      { id: 'h1', periodicity: 'DAILY', weekDays: [], createdAt: new Date('2026-01-01') },
    ] as any);
    p.task.count.mockResolvedValue(3);
    p.transaction.findMany.mockResolvedValue([
      { type: 'ingreso', amount: '1000', account: { currency: 'ARS' } },
      { type: 'egreso', amount: '400', account: { currency: 'ARS' } },
    ] as any);
    p.goal.findMany.mockResolvedValue([]);
    p.event.count.mockResolvedValue(2);
    p.habitRecord.findMany.mockResolvedValue([]);
  });

  it('returns stats with correct structure', async () => {
    const stats = await getWeekStats(USER_ID, WEEK_START);

    expect(stats).toHaveProperty('weekStart');
    expect(stats).toHaveProperty('weekEnd');
    expect(stats).toHaveProperty('habits');
    expect(stats).toHaveProperty('tasks');
    expect(stats).toHaveProperty('finance');
    expect(stats).toHaveProperty('goals');
    expect(stats).toHaveProperty('events');
  });

  it('computes habit completion rate between 0 and 100', async () => {
    const stats = await getWeekStats(USER_ID, WEEK_START);

    expect(stats.habits.completed).toBe(5);
    expect(stats.habits.rate).toBeGreaterThanOrEqual(0);
    expect(stats.habits.rate).toBeLessThanOrEqual(100);
  });

  it('groups finance by currency', async () => {
    const stats = await getWeekStats(USER_ID, WEEK_START);

    expect(stats.finance.byCurrency).toHaveLength(1);
    expect(stats.finance.byCurrency[0]).toMatchObject({
      currency: 'ARS',
      income: 1000,
      expenses: 400,
      balance: 600,
    });
  });

  it('returns empty goals array when no in-progress goals', async () => {
    const stats = await getWeekStats(USER_ID, WEEK_START);
    expect(stats.goals).toEqual([]);
  });

  it('returns event count correctly', async () => {
    const stats = await getWeekStats(USER_ID, WEEK_START);
    expect(stats.events.completed).toBe(2);
  });
});

describe('getOrCreateReview', () => {
  it('upserts a review for the given weekStart', async () => {
    const mockReview = {
      id: 'rev-1',
      userId: USER_ID,
      weekStart: new Date(WEEK_START),
      weekEnd: new Date('2026-05-31'),
      answers: [],
      focusGoals: [],
      focusTasks: [],
    };
    p.weeklyReview.upsert.mockResolvedValue(mockReview as any);

    const result = await getOrCreateReview(USER_ID, WEEK_START);

    expect(result.id).toBe('rev-1');
    expect(p.weeklyReview.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId_weekStart: expect.objectContaining({ userId: USER_ID }),
        }),
        create: expect.objectContaining({ userId: USER_ID }),
      })
    );
  });
});

describe('createReview', () => {
  it('calls upsert with correct user data', async () => {
    const mockReview = {
      id: 'rev-2',
      userId: USER_ID,
      weekStart: new Date(WEEK_START),
      weekEnd: new Date('2026-05-31'),
      answers: [],
      focusGoals: [],
      focusTasks: [],
    };
    p.weeklyReview.upsert.mockResolvedValue(mockReview as any);

    const result = await createReview(USER_ID, { weekStart: WEEK_START });

    expect(result.userId).toBe(USER_ID);
    expect(p.weeklyReview.upsert).toHaveBeenCalled();
  });
});
