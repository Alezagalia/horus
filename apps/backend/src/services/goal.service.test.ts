import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    goal: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    goalHabit: { upsert: vi.fn(), deleteMany: vi.fn() },
    goalTask: { upsert: vi.fn(), deleteMany: vi.fn() },
    keyResult: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
    category: { findFirst: vi.fn() },
    habit: { findFirst: vi.fn() },
    task: { findFirst: vi.fn() },
  },
}));

import { prisma } from '../lib/prisma.js';
import { listGoals, getGoalById, createGoal, updateGoal, deleteGoal } from './goal.service.js';

const p = vi.mocked(prisma, true);

const USER_ID = 'user-1';
const GOAL_ID = 'goal-1';
const CAT_ID = 'cat-1';

const mockGoalBase = {
  id: GOAL_ID,
  userId: USER_ID,
  title: 'Correr 5km',
  description: null,
  categoryId: CAT_ID,
  priority: 'media',
  status: 'en_progreso',
  isFeatured: false,
  targetDate: null,
  completedAt: null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  category: { id: CAT_ID, name: 'Fitness', icon: '🏋️', color: '#ff0' },
};

const mockGoal = {
  ...mockGoalBase,
  keyResults: [],
  goalHabits: [],
  goalTasks: [],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('listGoals', () => {
  it('returns goals with progress', async () => {
    p.goal.findMany.mockResolvedValue([mockGoal] as any);

    const result = await listGoals(USER_ID);

    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty('progress', 0);
    expect(result[0]).toHaveProperty('linkedHabitsCount', 0);
  });

  it('filters by status', async () => {
    p.goal.findMany.mockResolvedValue([]);

    await listGoals(USER_ID, 'completada');

    expect(p.goal.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ status: 'completada' }) })
    );
  });
});

describe('getGoalById', () => {
  it('returns goal with progress when found', async () => {
    p.goal.findFirst.mockResolvedValue(mockGoal as any);

    const result = await getGoalById(GOAL_ID, USER_ID);
    expect(result.id).toBe(GOAL_ID);
    expect(result).toHaveProperty('progress');
  });

  it('throws when goal not found', async () => {
    p.goal.findFirst.mockResolvedValue(null);
    await expect(getGoalById('bad-id', USER_ID)).rejects.toThrow('Meta no encontrada');
  });
});

describe('createGoal', () => {
  it('creates goal without category', async () => {
    const created = { ...mockGoal };
    p.goal.create.mockResolvedValue(created as any);

    const result = await createGoal(USER_ID, { title: 'Correr 5km', priority: 'media' });
    expect(result.title).toBe('Correr 5km');
    expect(result.progress).toBe(0);
  });

  it('creates goal with valid category', async () => {
    p.category.findFirst.mockResolvedValue({ id: CAT_ID } as any);
    p.goal.create.mockResolvedValue(mockGoal as any);

    const result = await createGoal(USER_ID, {
      title: 'Correr 5km',
      categoryId: CAT_ID,
      priority: 'media',
    });
    expect(result.id).toBe(GOAL_ID);
  });

  it('throws when category does not exist or wrong scope', async () => {
    p.category.findFirst.mockResolvedValue(null);

    await expect(
      createGoal(USER_ID, { title: 'X', categoryId: 'bad-cat', priority: 'media' })
    ).rejects.toThrow('La categoría no existe');
  });
});

describe('updateGoal', () => {
  it('updates goal fields', async () => {
    p.goal.findFirst.mockResolvedValue(mockGoalBase as any);
    p.goal.update.mockResolvedValue({ ...mockGoal, title: 'Correr 10km' } as any);

    const result = await updateGoal(GOAL_ID, USER_ID, { title: 'Correr 10km' });
    expect(result.title).toBe('Correr 10km');
  });

  it('sets completedAt when status changes to completada', async () => {
    p.goal.findFirst.mockResolvedValue(mockGoalBase as any);
    p.goal.update.mockResolvedValue({
      ...mockGoal,
      status: 'completada',
      completedAt: new Date(),
    } as any);

    const result = await updateGoal(GOAL_ID, USER_ID, { status: 'completada' });
    expect(result.status).toBe('completada');
    expect(result.completedAt).toBeTruthy();
  });

  it('throws when goal not found', async () => {
    p.goal.findFirst.mockResolvedValue(null);
    await expect(updateGoal('bad-id', USER_ID, { title: 'X' })).rejects.toThrow(
      'Meta no encontrada'
    );
  });
});

describe('deleteGoal', () => {
  it('soft-deletes goal', async () => {
    p.goal.findFirst.mockResolvedValue(mockGoalBase as any);
    p.goal.update.mockResolvedValue({ ...mockGoalBase, isActive: false } as any);

    const result = await deleteGoal(GOAL_ID, USER_ID);
    expect(result).toHaveProperty('isActive', false);
  });

  it('throws when goal not found', async () => {
    p.goal.findFirst.mockResolvedValue(null);
    await expect(deleteGoal('bad-id', USER_ID)).rejects.toThrow('Meta no encontrada');
  });
});

describe('progress calculation', () => {
  it('calculates progress from key results', async () => {
    const goalWithKRs = {
      ...mockGoal,
      keyResults: [
        { targetValue: '100', currentValue: '50', isActive: true },
        { targetValue: '100', currentValue: '75', isActive: true },
      ],
    };
    p.goal.findMany.mockResolvedValue([goalWithKRs] as any);

    const result = await listGoals(USER_ID);
    // avg(0.5, 0.75) * 100 = 62.5 → rounds to 63
    expect(result[0].progress).toBe(63);
  });

  it('falls back to task completion when no key results', async () => {
    const goalWithTasks = {
      ...mockGoal,
      keyResults: [],
      goalTasks: [{ task: { status: 'completada' } }, { task: { status: 'pendiente' } }],
    };
    p.goal.findMany.mockResolvedValue([goalWithTasks] as any);

    const result = await listGoals(USER_ID);
    expect(result[0].progress).toBe(50);
  });
});
