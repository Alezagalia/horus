import { describe, it, expect, beforeEach, vi } from 'vitest';

let mockUser: { id: string; email: string; emailVerifiedAt: Date | null } | null = {
  id: 'u1',
  email: 'a@b.c',
  emailVerifiedAt: new Date(),
};

vi.mock('../middlewares/auth.middleware.js', () => ({
  authMiddleware: (req: any, _res: any, next: any) => {
    req.user = mockUser;
    next();
  },
}));

const mockCreateCheckout = vi.fn();
const mockVerify = vi.fn();
const mockApply = vi.fn();
vi.mock('../services/lemonSqueezy.service.js', () => ({
  lemonSqueezyService: {
    createCheckout: (...a: unknown[]) => mockCreateCheckout(...a),
    verifyWebhookSignature: (...a: unknown[]) => mockVerify(...a),
    applyWebhookEvent: (...a: unknown[]) => mockApply(...a),
  },
}));

const mockGoogleVerify = vi.fn();
const mockGoogleRtdn = vi.fn();
vi.mock('../services/googlePlay.service.js', () => ({
  googlePlayService: {
    verifyPurchase: (...a: unknown[]) => mockGoogleVerify(...a),
    applyRtdnNotification: (...a: unknown[]) => mockGoogleRtdn(...a),
  },
}));

vi.mock('../services/entitlements.service.js', () => ({
  getEntitlements: vi.fn().mockResolvedValue({ plan: 'PRO', limits: {}, features: {} }),
}));

vi.mock('../config/env.js', () => ({
  env: { GOOGLE_PLAY_RTDN_SECRET: 'rtdn_secret' },
}));

import express from 'express';
import request from 'supertest';
import { errorMiddleware } from '../middlewares/error.middleware.js';
import billingRouter from './billing.routes.js';

function makeApp() {
  const app = express();
  app.use(
    express.json({
      verify: (req, _res, buf) => {
        (req as express.Request & { rawBody?: Buffer }).rawBody = buf;
      },
    })
  );
  app.use('/api/billing', billingRouter);
  app.use(errorMiddleware);
  return app;
}

const app = makeApp();

beforeEach(() => {
  vi.clearAllMocks();
  mockUser = { id: 'u1', email: 'a@b.c', emailVerifiedAt: new Date() };
});

describe('POST /api/billing/checkout', () => {
  it('403 when the email is not verified', async () => {
    mockUser = { id: 'u1', email: 'a@b.c', emailVerifiedAt: null };
    const res = await request(app).post('/api/billing/checkout').send({ interval: 'monthly' });
    expect(res.status).toBe(403);
    expect(mockCreateCheckout).not.toHaveBeenCalled();
  });

  it('200 with the checkout url for a verified user', async () => {
    mockCreateCheckout.mockResolvedValue({ url: 'https://checkout.example/abc' });
    const res = await request(app).post('/api/billing/checkout').send({ interval: 'annual' });
    expect(res.status).toBe(200);
    expect(res.body.url).toBe('https://checkout.example/abc');
    expect(mockCreateCheckout).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'u1', interval: 'annual' })
    );
  });
});

describe('POST /api/billing/webhook', () => {
  it('401 when the signature is invalid', async () => {
    mockVerify.mockReturnValue(false);
    const res = await request(app)
      .post('/api/billing/webhook')
      .set('X-Signature', 'bad')
      .send({ meta: { event_name: 'subscription_created' } });
    expect(res.status).toBe(401);
    expect(mockApply).not.toHaveBeenCalled();
  });

  it('200 and processes the event when the signature is valid', async () => {
    mockVerify.mockReturnValue(true);
    mockApply.mockResolvedValue(true);
    const res = await request(app)
      .post('/api/billing/webhook')
      .set('X-Signature', 'good')
      .send({ meta: { event_name: 'subscription_created', custom_data: { user_id: 'u1' } } });
    expect(res.status).toBe(200);
    expect(mockApply).toHaveBeenCalledOnce();
  });
});

describe('POST /api/billing/google/verify', () => {
  it('403 when the email is not verified', async () => {
    mockUser = { id: 'u1', email: 'a@b.c', emailVerifiedAt: null };
    const res = await request(app)
      .post('/api/billing/google/verify')
      .send({ productId: 'pro_monthly', purchaseToken: 'tok' });
    expect(res.status).toBe(403);
    expect(mockGoogleVerify).not.toHaveBeenCalled();
  });

  it('400 when the body is missing fields', async () => {
    const res = await request(app).post('/api/billing/google/verify').send({ productId: 'x' });
    expect(res.status).toBe(400);
    expect(mockGoogleVerify).not.toHaveBeenCalled();
  });

  it('200 with entitlements for a valid purchase', async () => {
    mockGoogleVerify.mockResolvedValue({ plan: 'PRO', status: 'ACTIVE', currentPeriodEnd: null });
    const res = await request(app)
      .post('/api/billing/google/verify')
      .send({ productId: 'pro_monthly', purchaseToken: 'tok_123' });
    expect(res.status).toBe(200);
    expect(res.body.plan).toBe('PRO');
    expect(mockGoogleVerify).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'u1', productId: 'pro_monthly', purchaseToken: 'tok_123' })
    );
  });
});

describe('POST /api/billing/google/rtdn', () => {
  it('401 when the secret is wrong', async () => {
    const res = await request(app).post('/api/billing/google/rtdn?secret=nope').send({});
    expect(res.status).toBe(401);
    expect(mockGoogleRtdn).not.toHaveBeenCalled();
  });

  it('200 and processes the notification with the right secret', async () => {
    mockGoogleRtdn.mockResolvedValue(true);
    const res = await request(app)
      .post('/api/billing/google/rtdn?secret=rtdn_secret')
      .send({ message: { data: 'eyJ9' } });
    expect(res.status).toBe(200);
    expect(mockGoogleRtdn).toHaveBeenCalledOnce();
  });
});
