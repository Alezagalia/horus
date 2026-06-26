import { describe, it, expect, beforeEach, vi } from 'vitest';

// --- Integration deps: stub authMiddleware to inject a configurable role,
//     and stub the heavy service the admin controller calls. ---
let injectedRole: 'USER' | 'ADMIN' | null = 'USER';

vi.mock('./auth.middleware.js', () => ({
  authMiddleware: (req: any, _res: any, next: any) => {
    req.user = injectedRole
      ? { id: 'u1', email: 'a@b.c', name: 'A', role: injectedRole }
      : undefined;
    next();
  },
}));

vi.mock('../services/monthlyExpenseGeneration.service.js', () => ({
  generateMonthlyExpensesForUser: vi.fn().mockResolvedValue({ created: 0 }),
}));

import request from 'supertest';
import type { Request, Response, NextFunction } from 'express';
import { adminRoleMiddleware } from './adminRole.middleware.js';
import { ForbiddenError, UnauthorizedError } from './error.middleware.js';
import { createTestApp } from '../test/helpers/app.factory.js';
import adminRouter from '../routes/admin.routes.js';

describe('adminRoleMiddleware (unit)', () => {
  const run = (user: unknown) => {
    const req = { user } as Request;
    const next = vi.fn();
    adminRoleMiddleware(req, {} as Response, next as unknown as NextFunction);
    return next.mock.calls[0]?.[0];
  };

  it('rejects with 401 when there is no authenticated user', () => {
    expect(run(undefined)).toBeInstanceOf(UnauthorizedError);
  });

  it('rejects with 403 when the user is not an admin', () => {
    expect(run({ id: 'u1', role: 'USER' })).toBeInstanceOf(ForbiddenError);
  });

  it('passes through (no error) for an admin', () => {
    expect(run({ id: 'u1', role: 'ADMIN' })).toBeUndefined();
  });
});

describe('admin routes role gating (integration)', () => {
  const app = createTestApp(['/api/admin', adminRouter]);

  beforeEach(() => {
    injectedRole = 'USER';
  });

  it('returns 403 for an authenticated non-admin user', async () => {
    injectedRole = 'USER';
    const res = await request(app).post('/api/admin/generate-monthly-expenses');
    expect(res.status).toBe(403);
  });

  it('allows an admin user through to the controller', async () => {
    injectedRole = 'ADMIN';
    const res = await request(app).post('/api/admin/generate-monthly-expenses');
    expect(res.status).not.toBe(403);
    expect(res.status).toBeLessThan(500);
  });
});
