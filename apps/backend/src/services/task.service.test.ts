import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    task: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
    },
    category: { findFirst: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import { prisma } from '../lib/prisma.js';
import { taskService } from './task.service.js';
import { NotFoundError, BadRequestError } from '../middlewares/error.middleware.js';

const p = vi.mocked(prisma);

const USER_ID = 'user-1';
const TASK_ID = 'task-1';
const CAT_ID = 'cat-1';

const mockCategory = { id: CAT_ID, userId: USER_ID, name: 'Work', isActive: true, scope: 'tareas' };

const mockTask = {
  id: TASK_ID,
  userId: USER_ID,
  categoryId: CAT_ID,
  title: 'Buy groceries',
  description: null,
  priority: 'media',
  status: 'pendiente',
  dueDate: null,
  completedAt: null,
  canceledAt: null,
  cancelReason: null,
  archivedAt: null,
  orderPosition: 0,
  rescheduleCount: 0,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  category: { id: CAT_ID, name: 'Work', icon: '💼', color: '#000', scope: 'tareas' },
  checklistItems: [],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('taskService.findAll', () => {
  it('returns tasks for user', async () => {
    p.task.findMany.mockResolvedValue([mockTask] as any);

    const result = await taskService.findAll(USER_ID);

    expect(result).toHaveLength(1);
    expect(p.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: USER_ID, isActive: true }),
      })
    );
  });

  it('applies status filter', async () => {
    p.task.findMany.mockResolvedValue([]);

    await taskService.findAll(USER_ID, { status: 'pendiente' });

    expect(p.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ status: 'pendiente' }) })
    );
  });
});

describe('taskService.findById', () => {
  it('returns task when found', async () => {
    p.task.findFirst.mockResolvedValue(mockTask as any);
    const result = await taskService.findById(TASK_ID, USER_ID);
    expect(result).toEqual(mockTask);
  });

  it('throws NotFoundError when task not found', async () => {
    p.task.findFirst.mockResolvedValue(null);
    await expect(taskService.findById('bad-id', USER_ID)).rejects.toThrow(NotFoundError);
  });
});

describe('taskService.create', () => {
  it('creates task with correct data', async () => {
    p.category.findFirst.mockResolvedValue(mockCategory as any);
    p.task.findFirst.mockResolvedValue({ orderPosition: 2 } as any);
    p.task.create.mockResolvedValue(mockTask as any);

    const result = await taskService.create(USER_ID, {
      categoryId: CAT_ID,
      title: 'Buy groceries',
      priority: 'media',
    });

    expect(result).toEqual(mockTask);
    expect(p.task.create).toHaveBeenCalled();
  });

  it('throws BadRequestError when category is not a task category', async () => {
    p.category.findFirst.mockResolvedValue(null);

    await expect(
      taskService.create(USER_ID, { categoryId: 'bad-cat', title: 'X', priority: 'media' })
    ).rejects.toThrow(BadRequestError);
  });
});

describe('taskService.update', () => {
  it('updates task fields', async () => {
    p.task.findFirst.mockResolvedValue(mockTask as any);
    p.task.update.mockResolvedValue({ ...mockTask, title: 'Updated' } as any);

    const result = await taskService.update(TASK_ID, USER_ID, { title: 'Updated' });
    expect(result).toHaveProperty('title', 'Updated');
  });

  it('sets completedAt when status changes to completada', async () => {
    p.task.findFirst.mockResolvedValue(mockTask as any);
    const completed = { ...mockTask, status: 'completada', completedAt: new Date() };
    p.task.update.mockResolvedValue(completed as any);

    const result = await taskService.update(TASK_ID, USER_ID, { status: 'completada' });
    expect(result.status).toBe('completada');
  });

  it('throws NotFoundError when task does not exist', async () => {
    p.task.findFirst.mockResolvedValue(null);
    await expect(taskService.update('bad-id', USER_ID, {})).rejects.toThrow(NotFoundError);
  });
});

describe('taskService.delete', () => {
  it('deletes task and reorders remaining', async () => {
    p.task.findFirst.mockResolvedValue(mockTask as any);
    p.task.delete.mockResolvedValue(mockTask as any);
    p.task.findMany.mockResolvedValue([]);

    const result = await taskService.delete(TASK_ID, USER_ID);
    expect(result).toHaveProperty('message', 'Task deleted successfully');
  });

  it('throws NotFoundError when task does not exist', async () => {
    p.task.findFirst.mockResolvedValue(null);
    await expect(taskService.delete('bad-id', USER_ID)).rejects.toThrow(NotFoundError);
  });
});

describe('taskService.toggleTaskStatus', () => {
  it('toggles pendiente → completada', async () => {
    p.task.findFirst.mockResolvedValue(mockTask as any);
    p.task.update.mockResolvedValue({
      ...mockTask,
      status: 'completada',
      completedAt: new Date(),
    } as any);

    const result = await taskService.toggleTaskStatus(TASK_ID, USER_ID);
    expect(result.status).toBe('completada');
  });

  it('toggles completada → pendiente', async () => {
    p.task.findFirst.mockResolvedValue({ ...mockTask, status: 'completada' } as any);
    p.task.update.mockResolvedValue({ ...mockTask, status: 'pendiente', completedAt: null } as any);

    const result = await taskService.toggleTaskStatus(TASK_ID, USER_ID);
    expect(result.status).toBe('pendiente');
  });

  it('throws BadRequestError for canceled tasks', async () => {
    p.task.findFirst.mockResolvedValue({ ...mockTask, status: 'cancelada' } as any);
    await expect(taskService.toggleTaskStatus(TASK_ID, USER_ID)).rejects.toThrow(BadRequestError);
  });
});
