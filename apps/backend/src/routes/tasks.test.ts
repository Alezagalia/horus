import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    task: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    category: { findFirst: vi.fn() },
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
import taskRouter from './task.routes.js';

const app = createTestApp(['/api/tasks', taskRouter]);
const p = vi.mocked(prisma);

const USER_ID = 'test-user-id';
const TASK_ID = '550e8400-e29b-41d4-a716-446655440001';
const CAT_ID = '550e8400-e29b-41d4-a716-446655440002';

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
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  category: { id: CAT_ID, name: 'Work', icon: '💼', color: '#000', scope: 'tareas' },
  checklistItems: [],
};

const mockCategory = { id: CAT_ID, userId: USER_ID, name: 'Work', isActive: true, scope: 'tareas' };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/tasks', () => {
  it('returns 200 with tasks list', async () => {
    p.task.findMany.mockResolvedValue([mockTask] as any);

    const res = await request(app).get('/api/tasks').set('Authorization', 'Bearer fake');
    expect(res.status).toBe(200);
    expect(res.body.tasks).toHaveLength(1);
  });

  it('returns empty array when no tasks', async () => {
    p.task.findMany.mockResolvedValue([]);

    const res = await request(app).get('/api/tasks').set('Authorization', 'Bearer fake');
    expect(res.status).toBe(200);
    expect(res.body.tasks).toHaveLength(0);
  });
});

describe('GET /api/tasks/:id', () => {
  it('returns 200 with task when found', async () => {
    p.task.findFirst.mockResolvedValue(mockTask as any);

    const res = await request(app).get(`/api/tasks/${TASK_ID}`).set('Authorization', 'Bearer fake');
    expect(res.status).toBe(200);
    expect(res.body.task.id).toBe(TASK_ID);
  });

  it('returns 404 when task not found', async () => {
    p.task.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/tasks/non-existent')
      .set('Authorization', 'Bearer fake');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/tasks', () => {
  it('returns 201 when task is created', async () => {
    p.category.findFirst.mockResolvedValue(mockCategory as any);
    p.task.findFirst.mockResolvedValue({ orderPosition: 0 } as any);
    p.task.create.mockResolvedValue(mockTask as any);

    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', 'Bearer fake')
      .send({ categoryId: CAT_ID, title: 'Buy groceries', priority: 'media' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('task');
  });

  it('returns 400 when category does not exist', async () => {
    p.category.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', 'Bearer fake')
      .send({ categoryId: 'bad-cat', title: 'X', priority: 'media' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when required fields missing', async () => {
    const res = await request(app).post('/api/tasks').set('Authorization', 'Bearer fake').send({});
    expect(res.status).toBe(400);
  });
});

describe('PUT /api/tasks/:id', () => {
  it('returns 200 when task is updated', async () => {
    p.task.findFirst.mockResolvedValue(mockTask as any);
    p.task.update.mockResolvedValue({ ...mockTask, title: 'Updated' } as any);

    const res = await request(app)
      .put(`/api/tasks/${TASK_ID}`)
      .set('Authorization', 'Bearer fake')
      .send({ title: 'Updated' });

    expect(res.status).toBe(200);
    expect(res.body.task.title).toBe('Updated');
  });

  it('returns 404 when task not found', async () => {
    p.task.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .put('/api/tasks/bad-id')
      .set('Authorization', 'Bearer fake')
      .send({ title: 'X' });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/tasks/:id', () => {
  it('returns 200 on successful delete', async () => {
    p.task.findFirst.mockResolvedValue(mockTask as any);
    p.task.delete.mockResolvedValue(mockTask as any);
    p.task.findMany.mockResolvedValue([]);

    const res = await request(app)
      .delete(`/api/tasks/${TASK_ID}`)
      .set('Authorization', 'Bearer fake');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message');
  });

  it('returns 404 when task not found', async () => {
    p.task.findFirst.mockResolvedValue(null);

    const res = await request(app).delete('/api/tasks/bad-id').set('Authorization', 'Bearer fake');
    expect(res.status).toBe(404);
  });
});
