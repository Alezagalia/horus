import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    habit: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
    },
    habitRecord: { findFirst: vi.fn(), findMany: vi.fn(), upsert: vi.fn(), count: vi.fn() },
    habitAudit: { create: vi.fn(), createMany: vi.fn() },
    category: { findFirst: vi.fn() },
    subscription: { findUnique: vi.fn().mockResolvedValue(null) },
    $transaction: vi.fn(),
  },
}));

vi.mock('../middlewares/auth.middleware.js', () => ({
  authMiddleware: (req: any, _res: any, next: any) => {
    req.user = { id: 'test-user-id', email: 'test@horus.app', name: 'Test User' };
    next();
  },
}));

import request from 'supertest';
import { prisma } from '../lib/prisma.js';
import { createTestApp } from '../test/helpers/app.factory.js';
import habitRouter from './habit.routes.js';

const app = createTestApp(['/api/habits', habitRouter]);
const p = vi.mocked(prisma);

const USER_ID = 'test-user-id';
const HABIT_ID = '550e8400-e29b-41d4-a716-446655440001';
const CAT_ID = '550e8400-e29b-41d4-a716-446655440002';

const mockHabit = {
  id: HABIT_ID,
  userId: USER_ID,
  categoryId: CAT_ID,
  name: 'Meditar',
  type: 'CHECK',
  periodicity: 'DAILY',
  weekDays: [1, 2, 3, 4, 5],
  timeOfDay: 'morning',
  order: 0,
  isActive: true,
  currentStreak: 0,
  longestStreak: 0,
  lastCompletedDate: null,
  description: null,
  reminderTime: null,
  color: null,
  targetValue: null,
  unit: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  category: { id: CAT_ID, name: 'Salud', icon: '🏃', color: '#ff0', scope: 'habitos' },
};

beforeEach(() => {
  vi.clearAllMocks();
  p.$transaction.mockImplementation((fnOrArray: unknown) => {
    if (typeof fnOrArray === 'function') return (fnOrArray as (tx: any) => unknown)(p);
    return Promise.all(fnOrArray as Promise<unknown>[]);
  });
});

describe('GET /api/habits', () => {
  it('returns 200 with habits list', async () => {
    p.habit.findMany.mockResolvedValue([mockHabit] as any);

    const res = await request(app).get('/api/habits').set('Authorization', 'Bearer fake');
    expect(res.status).toBe(200);
    expect(res.body.habits).toHaveLength(1);
  });

  it('returns empty array when no habits', async () => {
    p.habit.findMany.mockResolvedValue([]);

    const res = await request(app).get('/api/habits').set('Authorization', 'Bearer fake');
    expect(res.status).toBe(200);
    expect(res.body.habits).toHaveLength(0);
  });
});

describe('GET /api/habits/:id', () => {
  it('returns 200 with habit when found', async () => {
    p.habit.findFirst.mockResolvedValue(mockHabit as any);

    const res = await request(app)
      .get(`/api/habits/${HABIT_ID}`)
      .set('Authorization', 'Bearer fake');
    expect(res.status).toBe(200);
    expect(res.body.habit.id).toBe(HABIT_ID);
  });

  it('returns 404 when habit not found', async () => {
    p.habit.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/habits/non-existent')
      .set('Authorization', 'Bearer fake');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/habits', () => {
  const validPayload = {
    categoryId: CAT_ID,
    name: 'Meditar',
    type: 'CHECK',
    periodicity: 'DAILY',
    weekDays: [1, 2, 3, 4, 5],
    timeOfDay: 'morning',
    order: 0,
  };

  it('returns 201 when habit is created', async () => {
    p.category.findFirst.mockResolvedValue({ id: CAT_ID, userId: USER_ID, isActive: true } as any);
    p.$transaction.mockImplementation(async (fn: (tx: any) => unknown) => {
      const tx = {
        habit: { create: vi.fn().mockResolvedValue(mockHabit) },
        habitAudit: { create: vi.fn().mockResolvedValue({}) },
      };
      return fn(tx);
    });

    const res = await request(app)
      .post('/api/habits')
      .set('Authorization', 'Bearer fake')
      .send(validPayload);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('habit');
  });

  it('returns 404 when category not found', async () => {
    p.category.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/habits')
      .set('Authorization', 'Bearer fake')
      .send(validPayload);
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/habits/:id', () => {
  it('returns 200 when habit is updated', async () => {
    p.habit.findFirst.mockResolvedValue(mockHabit as any);
    p.$transaction.mockImplementation(async (fn: (tx: any) => unknown) => {
      const tx = {
        habit: { update: vi.fn().mockResolvedValue({ ...mockHabit, name: 'New Name' }) },
        habitAudit: { createMany: vi.fn().mockResolvedValue({}) },
      };
      return fn(tx);
    });

    const res = await request(app)
      .put(`/api/habits/${HABIT_ID}`)
      .set('Authorization', 'Bearer fake')
      .send({ name: 'New Name' });

    expect(res.status).toBe(200);
    expect(res.body.habit.name).toBe('New Name');
  });
});

describe('DELETE /api/habits/:id', () => {
  it('returns 200 on successful delete', async () => {
    p.habit.findFirst.mockResolvedValue(mockHabit as any);
    p.$transaction.mockImplementation(async (fn: (tx: any) => unknown) => {
      const tx = {
        habit: { update: vi.fn().mockResolvedValue({ ...mockHabit, isActive: false }) },
        habitAudit: { create: vi.fn().mockResolvedValue({}) },
      };
      return fn(tx);
    });

    const res = await request(app)
      .delete(`/api/habits/${HABIT_ID}`)
      .set('Authorization', 'Bearer fake');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message');
  });
});

describe('POST /api/habits/:id/records', () => {
  it('returns 400 when body is invalid', async () => {
    const res = await request(app)
      .post(`/api/habits/${HABIT_ID}/records`)
      .set('Authorization', 'Bearer fake')
      .send({});
    expect(res.status).toBe(400);
  });
});
