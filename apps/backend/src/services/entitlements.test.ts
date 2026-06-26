import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    subscription: { findUnique: vi.fn() },
    habit: { count: vi.fn() },
    goal: { count: vi.fn() },
    account: { count: vi.fn() },
  },
}));

import {
  resolvePlan,
  getPlan,
  hasFeature,
  assertWithinLimit,
  PLAN_LIMITS,
} from './entitlements.service.js';
import { PaymentRequiredError } from '../middlewares/error.middleware.js';
import { prisma } from '../lib/prisma.js';

const p = vi.mocked(prisma, true);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('resolvePlan', () => {
  const future = new Date(Date.now() + 86_400_000);
  const past = new Date(Date.now() - 86_400_000);

  it('is FREE with no subscription row', () => {
    expect(resolvePlan(null)).toBe('FREE');
  });

  it('is PRO when active', () => {
    expect(resolvePlan({ plan: 'PRO', status: 'ACTIVE', currentPeriodEnd: future })).toBe('PRO');
  });

  it('is PRO while trialing', () => {
    expect(resolvePlan({ plan: 'PRO', status: 'TRIALING', currentPeriodEnd: null })).toBe('PRO');
  });

  it('keeps PRO when canceled but still within the paid period', () => {
    expect(resolvePlan({ plan: 'PRO', status: 'CANCELED', currentPeriodEnd: future })).toBe('PRO');
  });

  it('drops to FREE when canceled and the period has ended', () => {
    expect(resolvePlan({ plan: 'PRO', status: 'CANCELED', currentPeriodEnd: past })).toBe('FREE');
  });

  it('drops to FREE when expired', () => {
    expect(resolvePlan({ plan: 'PRO', status: 'EXPIRED', currentPeriodEnd: future })).toBe('FREE');
  });
});

describe('hasFeature', () => {
  it('denies Pro features to Free users', async () => {
    p.subscription.findUnique.mockResolvedValue(null as never);
    expect(await hasFeature('u1', 'calendarSync')).toBe(false);
  });

  it('grants Pro features to Pro users', async () => {
    p.subscription.findUnique.mockResolvedValue({
      plan: 'PRO',
      status: 'ACTIVE',
      currentPeriodEnd: null,
    } as never);
    expect(await hasFeature('u1', 'nutrition')).toBe(true);
  });
});

describe('assertWithinLimit', () => {
  it('throws PaymentRequiredError when a Free user is at the limit', async () => {
    p.subscription.findUnique.mockResolvedValue(null as never);
    p.habit.count.mockResolvedValue(PLAN_LIMITS.FREE.limits.habits as never);

    await expect(assertWithinLimit('u1', 'habits')).rejects.toBeInstanceOf(PaymentRequiredError);
  });

  it('allows a Free user below the limit', async () => {
    p.subscription.findUnique.mockResolvedValue(null as never);
    p.habit.count.mockResolvedValue(1 as never);

    await expect(assertWithinLimit('u1', 'habits')).resolves.toBeUndefined();
  });

  it('never blocks a Pro user (unlimited) and skips counting', async () => {
    p.subscription.findUnique.mockResolvedValue({
      plan: 'PRO',
      status: 'ACTIVE',
      currentPeriodEnd: null,
    } as never);

    await expect(assertWithinLimit('u1', 'goals')).resolves.toBeUndefined();
    expect(p.goal.count).not.toHaveBeenCalled();
  });
});

describe('getPlan', () => {
  it('reads the subscription and resolves the effective plan', async () => {
    p.subscription.findUnique.mockResolvedValue({
      plan: 'PRO',
      status: 'ACTIVE',
      currentPeriodEnd: null,
    } as never);
    expect(await getPlan('u1')).toBe('PRO');
  });
});
