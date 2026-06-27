import { Request, Response, NextFunction } from 'express';
import * as z from 'zod';
import { UnauthorizedError, ForbiddenError } from '../middlewares/error.middleware.js';
import { lemonSqueezyService } from '../services/lemonSqueezy.service.js';
import { googlePlayService } from '../services/googlePlay.service.js';
import { getEntitlements } from '../services/entitlements.service.js';
import { env } from '../config/env.js';
import { logger } from '../lib/logger.js';

const checkoutSchema = z.object({
  interval: z.enum(['monthly', 'annual']).default('monthly'),
});

const googleVerifySchema = z.object({
  productId: z.string().min(1),
  purchaseToken: z.string().min(1),
});

export const billingController = {
  /**
   * POST /api/billing/checkout
   * Starts a Lemon Squeezy checkout for the Pro plan and returns its URL.
   * Requires a verified email (the S-01.3 gate: verify before you can pay).
   */
  async createCheckout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) throw new UnauthorizedError('User not found');

      if (!user.emailVerifiedAt) {
        throw new ForbiddenError('Verificá tu email antes de suscribirte.');
      }

      const { interval } = checkoutSchema.parse(req.body ?? {});
      const { url } = await lemonSqueezyService.createCheckout({
        userId: user.id,
        email: user.email,
        interval,
      });

      res.status(200).json({ url });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/billing/webhook
   * Lemon Squeezy subscription webhook. Verifies the HMAC signature against the
   * raw body, then syncs our Subscription row. Always 200s on a valid signature
   * so Lemon Squeezy doesn't retry unhandled-but-fine events.
   */
  async webhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const signature = req.header('X-Signature');
      const raw = req.rawBody;

      if (!raw || !lemonSqueezyService.verifyWebhookSignature(raw, signature)) {
        res.status(401).json({ message: 'Invalid signature' });
        return;
      }

      const payload = JSON.parse(raw.toString('utf8'));
      const handled = await lemonSqueezyService.applyWebhookEvent(payload);

      logger.info('[billing.webhook] processed', {
        event: payload?.meta?.event_name,
        handled,
      });

      res.status(200).json({ received: true });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/billing/google/verify
   * Verifies a Google Play purchase made by the mobile client and returns the
   * user's refreshed entitlements. Requires auth + a verified email.
   */
  async verifyGooglePurchase(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) throw new UnauthorizedError('User not found');

      if (!user.emailVerifiedAt) {
        throw new ForbiddenError('Verificá tu email antes de suscribirte.');
      }

      const { productId, purchaseToken } = googleVerifySchema.parse(req.body ?? {});
      await googlePlayService.verifyPurchase({ userId: user.id, productId, purchaseToken });

      const entitlements = await getEntitlements(user.id);
      res.status(200).json(entitlements);
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/billing/google/rtdn?secret=...
   * Google Play Real-Time Developer Notifications (Pub/Sub push). Guarded by a
   * shared secret. Always 200s on a valid secret so Pub/Sub doesn't retry
   * notifications we've already accepted.
   */
  async googleRtdn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const secret = env.GOOGLE_PLAY_RTDN_SECRET;
      if (!secret || req.query.secret !== secret) {
        res.status(401).json({ message: 'Invalid secret' });
        return;
      }

      const handled = await googlePlayService.applyRtdnNotification(req.body);
      logger.info('[billing.rtdn] processed', { handled });
      res.status(200).json({ received: true });
    } catch (error) {
      next(error);
    }
  },
};
