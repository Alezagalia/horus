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
