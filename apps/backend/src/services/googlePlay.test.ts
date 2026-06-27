import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { androidpublisher_v3 } from 'googleapis';

vi.mock('../config/env.js', () => ({
  env: {
    GOOGLE_PLAY_PACKAGE_NAME: 'com.horus.app',
    GOOGLE_PLAY_SERVICE_ACCOUNT_JSON: '{"client_email":"x","private_key":"y"}',
    GOOGLE_PLAY_PRODUCT_PRO_MONTHLY: 'pro_monthly',
    GOOGLE_PLAY_PRODUCT_PRO_ANNUAL: 'pro_annual',
    GOOGLE_PLAY_RTDN_SECRET: 'rtdn_secret',
  },
}));

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    subscription: { upsert: vi.fn(), findFirst: vi.fn() },
  },
}));

import {
  isConfigured,
  mapSubscriptionState,
  decodeRtdnMessage,
  verifyPurchase,
  applyRtdnNotification,
  __setPublisherForTest,
} from './googlePlay.service.js';
import { prisma } from '../lib/prisma.js';

const p = vi.mocked(prisma, true);

const get = vi.fn();
const acknowledge = vi.fn();
const mockPublisher = {
  purchases: {
    subscriptionsv2: { get },
    subscriptions: { acknowledge },
  },
} as unknown as androidpublisher_v3.Androidpublisher;

// An active purchase that expires far in the future, so resolvePlan → PRO.
const activePurchase = {
  data: {
    subscriptionState: 'SUBSCRIPTION_STATE_ACTIVE',
    acknowledgementState: 'ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED',
    latestOrderId: 'GPA.1234',
    lineItems: [{ productId: 'pro_monthly', expiryTime: '2099-01-01T00:00:00Z' }],
  },
};

const encodeRtdn = (notification: unknown) => ({
  message: { data: Buffer.from(JSON.stringify(notification)).toString('base64') },
});

beforeEach(() => {
  vi.clearAllMocks();
  __setPublisherForTest(mockPublisher);
  get.mockResolvedValue(activePurchase);
  acknowledge.mockResolvedValue({});
});

describe('isConfigured', () => {
  it('is true when package name + service account are set', () => {
    expect(isConfigured()).toBe(true);
  });
});

describe('mapSubscriptionState', () => {
  it.each([
    ['SUBSCRIPTION_STATE_ACTIVE', 'ACTIVE'],
    ['SUBSCRIPTION_STATE_IN_GRACE_PERIOD', 'PAST_DUE'],
    ['SUBSCRIPTION_STATE_ON_HOLD', 'PAST_DUE'],
    ['SUBSCRIPTION_STATE_CANCELED', 'CANCELED'],
    ['SUBSCRIPTION_STATE_PENDING', 'EXPIRED'],
    ['SUBSCRIPTION_STATE_PAUSED', 'EXPIRED'],
    ['SUBSCRIPTION_STATE_EXPIRED', 'EXPIRED'],
    [undefined, 'EXPIRED'],
  ])('maps %s -> %s', (state, expected) => {
    expect(mapSubscriptionState(state as string)).toBe(expected);
  });
});

describe('decodeRtdnMessage', () => {
  it('decodes a base64 Pub/Sub envelope', () => {
    const decoded = decodeRtdnMessage(encodeRtdn({ packageName: 'com.horus.app' }));
    expect(decoded?.packageName).toBe('com.horus.app');
  });

  it('returns null when there is no message data', () => {
    expect(decodeRtdnMessage({})).toBeNull();
  });
});

describe('verifyPurchase', () => {
  it('rejects an unknown product id', async () => {
    await expect(
      verifyPurchase({ userId: 'u1', productId: 'some_other_sku', purchaseToken: 'tok' })
    ).rejects.toThrow(/desconocido/i);
    expect(p.subscription.upsert).not.toHaveBeenCalled();
  });

  it('upserts Pro for an active purchase', async () => {
    const result = await verifyPurchase({
      userId: 'u1',
      productId: 'pro_monthly',
      purchaseToken: 'tok_123',
    });

    expect(result.plan).toBe('PRO');
    expect(result.status).toBe('ACTIVE');
    expect(p.subscription.upsert).toHaveBeenCalledOnce();
    const arg = p.subscription.upsert.mock.calls[0][0] as {
      where: { userId: string };
      update: { plan: string; provider: string; providerSubscriptionId: string };
    };
    expect(arg.where).toEqual({ userId: 'u1' });
    expect(arg.update.plan).toBe('PRO');
    expect(arg.update.provider).toBe('GOOGLE_PLAY');
    expect(arg.update.providerSubscriptionId).toBe('tok_123');
  });

  it('acknowledges a purchase that is pending acknowledgement', async () => {
    get.mockResolvedValue({
      data: { ...activePurchase.data, acknowledgementState: 'ACKNOWLEDGEMENT_STATE_PENDING' },
    });

    await verifyPurchase({ userId: 'u1', productId: 'pro_monthly', purchaseToken: 'tok_123' });

    expect(acknowledge).toHaveBeenCalledWith(
      expect.objectContaining({ subscriptionId: 'pro_monthly', token: 'tok_123' })
    );
  });

  it('still grants access when acknowledge fails', async () => {
    get.mockResolvedValue({
      data: { ...activePurchase.data, acknowledgementState: 'ACKNOWLEDGEMENT_STATE_PENDING' },
    });
    acknowledge.mockRejectedValue(new Error('network'));

    const result = await verifyPurchase({
      userId: 'u1',
      productId: 'pro_monthly',
      purchaseToken: 'tok_123',
    });

    expect(result.plan).toBe('PRO');
    expect(p.subscription.upsert).toHaveBeenCalledOnce();
  });
});

describe('applyRtdnNotification', () => {
  it('acknowledges a test notification without syncing', async () => {
    const handled = await applyRtdnNotification(
      encodeRtdn({ testNotification: { version: '1.0' } })
    );
    expect(handled).toBe(true);
    expect(p.subscription.findFirst).not.toHaveBeenCalled();
    expect(p.subscription.upsert).not.toHaveBeenCalled();
  });

  it('ignores an RTDN for an unknown purchaseToken', async () => {
    p.subscription.findFirst.mockResolvedValue(null as never);

    const handled = await applyRtdnNotification(
      encodeRtdn({
        subscriptionNotification: {
          notificationType: 4,
          purchaseToken: 'tok_x',
          subscriptionId: 'pro_monthly',
        },
      })
    );

    expect(handled).toBe(true);
    expect(p.subscription.upsert).not.toHaveBeenCalled();
  });

  it('re-syncs a known subscription from an RTDN', async () => {
    p.subscription.findFirst.mockResolvedValue({ userId: 'u2' } as never);

    await applyRtdnNotification(
      encodeRtdn({
        subscriptionNotification: {
          notificationType: 2,
          purchaseToken: 'tok_known',
          subscriptionId: 'pro_monthly',
        },
      })
    );

    expect(p.subscription.findFirst).toHaveBeenCalledWith({
      where: { providerSubscriptionId: 'tok_known', provider: 'GOOGLE_PLAY' },
      select: { userId: true },
    });
    const arg = p.subscription.upsert.mock.calls[0][0] as { where: { userId: string } };
    expect(arg.where).toEqual({ userId: 'u2' });
  });
});
