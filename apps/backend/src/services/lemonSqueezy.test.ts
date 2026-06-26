import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createHmac } from 'crypto';

vi.mock('../config/env.js', () => ({
  env: {
    LEMONSQUEEZY_API_KEY: 'key',
    LEMONSQUEEZY_STORE_ID: 'store_1',
    LEMONSQUEEZY_WEBHOOK_SECRET: 'whsec_test',
    LEMONSQUEEZY_VARIANT_PRO_MONTHLY: 'var_m',
    LEMONSQUEEZY_VARIANT_PRO_ANNUAL: 'var_a',
  },
}));

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    subscription: { upsert: vi.fn(), findFirst: vi.fn() },
  },
}));

import {
  verifyWebhookSignature,
  mapStatus,
  applyWebhookEvent,
  isConfigured,
} from './lemonSqueezy.service.js';
import { prisma } from '../lib/prisma.js';

const p = vi.mocked(prisma, true);
const SECRET = 'whsec_test';

const sign = (body: string) => createHmac('sha256', SECRET).update(Buffer.from(body)).digest('hex');

beforeEach(() => vi.clearAllMocks());

describe('isConfigured', () => {
  it('is true when api key + store id are set', () => {
    expect(isConfigured()).toBe(true);
  });
});

describe('verifyWebhookSignature', () => {
  it('accepts a correct signature', () => {
    const body = JSON.stringify({ hello: 'world' });
    expect(verifyWebhookSignature(Buffer.from(body), sign(body))).toBe(true);
  });

  it('rejects a tampered body', () => {
    const body = JSON.stringify({ hello: 'world' });
    expect(verifyWebhookSignature(Buffer.from('{"hello":"evil"}'), sign(body))).toBe(false);
  });

  it('rejects when signature is missing', () => {
    expect(verifyWebhookSignature(Buffer.from('{}'), undefined)).toBe(false);
  });
});

describe('mapStatus', () => {
  it.each([
    ['on_trial', 'TRIALING'],
    ['active', 'ACTIVE'],
    ['past_due', 'PAST_DUE'],
    ['unpaid', 'PAST_DUE'],
    ['cancelled', 'CANCELED'],
    ['expired', 'EXPIRED'],
    ['paused', 'EXPIRED'],
  ])('maps %s -> %s', (ls, expected) => {
    expect(mapStatus(ls)).toBe(expected);
  });
});

describe('applyWebhookEvent', () => {
  it('ignores non-subscription events', async () => {
    expect(await applyWebhookEvent({ meta: { event_name: 'order_created' } })).toBe(false);
    expect(p.subscription.upsert).not.toHaveBeenCalled();
  });

  it('acknowledges payment events without touching the subscription', async () => {
    const handled = await applyWebhookEvent({
      meta: { event_name: 'subscription_payment_success' },
    });
    expect(handled).toBe(true);
    expect(p.subscription.upsert).not.toHaveBeenCalled();
  });

  it('upserts Pro on subscription_created using custom_data.user_id', async () => {
    await applyWebhookEvent({
      meta: { event_name: 'subscription_created', custom_data: { user_id: 'u1' } },
      data: { id: 'sub_1', attributes: { status: 'active', renews_at: '2026-07-24T00:00:00Z' } },
    });

    expect(p.subscription.upsert).toHaveBeenCalledOnce();
    const arg = p.subscription.upsert.mock.calls[0][0] as {
      where: { userId: string };
      update: { plan: string; status: string };
    };
    expect(arg.where).toEqual({ userId: 'u1' });
    expect(arg.update.plan).toBe('PRO');
    expect(arg.update.status).toBe('ACTIVE');
  });

  it('resolves the user via providerSubscriptionId when custom data is absent', async () => {
    p.subscription.findFirst.mockResolvedValue({ userId: 'u2' } as never);

    await applyWebhookEvent({
      meta: { event_name: 'subscription_updated' },
      data: { id: 'sub_9', attributes: { status: 'cancelled', ends_at: '2026-08-01T00:00:00Z' } },
    });

    expect(p.subscription.findFirst).toHaveBeenCalledWith({
      where: { providerSubscriptionId: 'sub_9' },
      select: { userId: true },
    });
    const arg = p.subscription.upsert.mock.calls[0][0] as { where: { userId: string } };
    expect(arg.where).toEqual({ userId: 'u2' });
  });
});
