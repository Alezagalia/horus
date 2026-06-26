import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    passwordResetToken: { deleteMany: vi.fn() },
    emailVerificationToken: { deleteMany: vi.fn() },
    user: { findMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock('../services/accountDeletion.service.js', () => ({
  deleteAccount: vi.fn().mockResolvedValue(undefined),
}));

// Mutable env so each test can flip the purge flags.
vi.mock('../config/env.js', () => ({
  env: { INACTIVE_ACCOUNT_PURGE_DAYS: '0', INACTIVE_ACCOUNT_PURGE_ENABLED: 'false' },
}));

import { purgeExpiredTokens, purgeInactiveAccounts } from './retention.job.js';
import { prisma } from '../lib/prisma.js';
import { deleteAccount } from '../services/accountDeletion.service.js';
import { env } from '../config/env.js';

const p = vi.mocked(prisma, true);
const mockDelete = vi.mocked(deleteAccount);

beforeEach(() => {
  vi.clearAllMocks();
  env.INACTIVE_ACCOUNT_PURGE_DAYS = '0';
  env.INACTIVE_ACCOUNT_PURGE_ENABLED = 'false';
});

describe('purgeExpiredTokens', () => {
  it('deletes expired/used tokens of both kinds in one transaction', async () => {
    p.$transaction.mockResolvedValue([{ count: 3 }, { count: 5 }] as never);

    const result = await purgeExpiredTokens();

    expect(p.$transaction).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ resetTokens: 3, verificationTokens: 5 });
  });
});

describe('purgeInactiveAccounts', () => {
  it('is disabled (no candidates queried) when threshold is 0', async () => {
    const result = await purgeInactiveAccounts();
    expect(p.user.findMany).not.toHaveBeenCalled();
    expect(result).toEqual({ candidates: [], deleted: false });
  });

  it('runs DRY-RUN (no deletion) when a threshold is set but not enabled', async () => {
    env.INACTIVE_ACCOUNT_PURGE_DAYS = '365';
    env.INACTIVE_ACCOUNT_PURGE_ENABLED = 'false';
    p.user.findMany.mockResolvedValue([{ id: 'a' }, { id: 'b' }] as never);

    const result = await purgeInactiveAccounts();

    expect(p.user.findMany).toHaveBeenCalledOnce();
    expect(mockDelete).not.toHaveBeenCalled();
    expect(result).toEqual({ candidates: ['a', 'b'], deleted: false });
  });

  it('actually deletes when threshold > 0 AND enabled', async () => {
    env.INACTIVE_ACCOUNT_PURGE_DAYS = '365';
    env.INACTIVE_ACCOUNT_PURGE_ENABLED = 'true';
    p.user.findMany.mockResolvedValue([{ id: 'a' }, { id: 'b' }] as never);

    const result = await purgeInactiveAccounts();

    expect(mockDelete).toHaveBeenCalledTimes(2);
    expect(mockDelete).toHaveBeenCalledWith('a');
    expect(result.deleted).toBe(true);
  });
});
