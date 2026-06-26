import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

vi.mock('../config/env.js', () => ({ env: { BILLING_ENFORCED: 'false' } }));

vi.mock('../services/entitlements.service.js', () => ({
  entitlementsService: {
    hasFeature: vi.fn(),
    assertWithinLimit: vi.fn(),
  },
}));

import { requireFeature, enforceLimit } from './entitlements.middleware.js';
import { entitlementsService } from '../services/entitlements.service.js';
import { PaymentRequiredError } from './error.middleware.js';
import { env } from '../config/env.js';

const svc = vi.mocked(entitlementsService, true);

const run = (mw: ReturnType<typeof enforceLimit>) => {
  const req = { user: { id: 'u1' } } as unknown as Request;
  const next = vi.fn();
  return mw(req, {} as Response, next as unknown as NextFunction).then(() => next);
};

beforeEach(() => {
  vi.clearAllMocks();
  env.BILLING_ENFORCED = 'false';
});

describe('entitlement middleware (gating disabled)', () => {
  it('enforceLimit is a no-op and never queries when billing is off', async () => {
    const next = await run(enforceLimit('habits'));
    expect(svc.assertWithinLimit).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith();
  });

  it('requireFeature is a no-op when billing is off', async () => {
    const next = await run(requireFeature('calendarSync'));
    expect(svc.hasFeature).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith();
  });
});

describe('entitlement middleware (gating enabled)', () => {
  beforeEach(() => {
    env.BILLING_ENFORCED = 'true';
  });

  it('enforceLimit passes a PaymentRequiredError to next when over the limit', async () => {
    svc.assertWithinLimit.mockRejectedValue(new PaymentRequiredError('limit'));
    const next = await run(enforceLimit('habits'));
    expect(next.mock.calls[0][0]).toBeInstanceOf(PaymentRequiredError);
  });

  it('requireFeature blocks a user without the feature', async () => {
    svc.hasFeature.mockResolvedValue(false);
    const next = await run(requireFeature('nutrition'));
    expect(next.mock.calls[0][0]).toBeInstanceOf(PaymentRequiredError);
  });

  it('requireFeature lets a user with the feature through', async () => {
    svc.hasFeature.mockResolvedValue(true);
    const next = await run(requireFeature('nutrition'));
    expect(next).toHaveBeenCalledWith();
  });
});
