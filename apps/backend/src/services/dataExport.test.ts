import { describe, it, expect, vi } from 'vitest';

// Proxy mock: every model exposes findMany/findUnique returning empty-ish data,
// so we can assert the assembled shape without enumerating 30 delegates.
vi.mock('../lib/prisma.js', () => {
  const handler = {
    get: () => ({
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue({ id: 'u1', email: 'a@b.c', name: 'A' }),
    }),
  };
  return { prisma: new Proxy({}, handler) };
});

import { exportUserData } from './dataExport.service.js';

describe('exportUserData', () => {
  it('returns a grouped snapshot with a timestamp and the user profile', async () => {
    const data = await exportUserData('u1');

    expect(typeof data.exportedAt).toBe('string');
    expect(data.user).toMatchObject({ id: 'u1', email: 'a@b.c' });
    expect(data).toHaveProperty('productivity.habits');
    expect(data).toHaveProperty('finance.accounts');
    expect(data).toHaveProperty('fitness.workouts');
    expect(data).toHaveProperty('nutrition.recipes');
  });

  it('does not leak credentials in the user profile', async () => {
    const data = await exportUserData('u1');
    expect(data.user).not.toHaveProperty('password');
    expect(data.user).not.toHaveProperty('refreshToken');
  });
});
