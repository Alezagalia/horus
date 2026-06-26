import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    user: { update: vi.fn() },
  },
}));

import { authService, LOGIN_MAX_ATTEMPTS, LOGIN_LOCK_MINUTES } from './auth.service.js';
import { prisma } from '../lib/prisma.js';

const p = vi.mocked(prisma, true);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getLockRemainingMs', () => {
  it('returns null when there is no lock', () => {
    expect(authService.getLockRemainingMs({ lockedUntil: null })).toBeNull();
  });

  it('returns null when the lock is in the past', () => {
    expect(authService.getLockRemainingMs({ lockedUntil: new Date(Date.now() - 1000) })).toBeNull();
  });

  it('returns remaining ms when the lock is in the future', () => {
    const ms = authService.getLockRemainingMs({
      lockedUntil: new Date(Date.now() + 5 * 60 * 1000),
    });
    expect(ms).toBeGreaterThan(0);
  });
});

describe('recordFailedLogin', () => {
  it('increments the counter below the threshold without locking', async () => {
    await authService.recordFailedLogin({ id: 'u1', failedLoginAttempts: 2 });
    expect(p.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { failedLoginAttempts: 3 },
    });
  });

  it('locks the account and resets the counter at the threshold', async () => {
    await authService.recordFailedLogin({
      id: 'u1',
      failedLoginAttempts: LOGIN_MAX_ATTEMPTS - 1,
    });
    const call = p.user.update.mock.calls[0][0] as {
      data: { failedLoginAttempts: number; lockedUntil: Date };
    };
    expect(call.data.failedLoginAttempts).toBe(0);
    expect(call.data.lockedUntil).toBeInstanceOf(Date);
    // Lock window roughly matches the configured cool-off.
    const minutes = (call.data.lockedUntil.getTime() - Date.now()) / 60000;
    expect(minutes).toBeGreaterThan(LOGIN_LOCK_MINUTES - 1);
    expect(minutes).toBeLessThanOrEqual(LOGIN_LOCK_MINUTES);
  });
});

describe('resetLoginAttempts', () => {
  it('is a no-op when nothing is accumulated', async () => {
    await authService.resetLoginAttempts({ id: 'u1', failedLoginAttempts: 0, lockedUntil: null });
    expect(p.user.update).not.toHaveBeenCalled();
  });

  it('clears the counter and the lock when present', async () => {
    await authService.resetLoginAttempts({
      id: 'u1',
      failedLoginAttempts: 3,
      lockedUntil: new Date(),
    });
    expect(p.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });
  });
});
