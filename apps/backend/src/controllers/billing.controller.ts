import { Request, Response, NextFunction } from 'express';
import * as z from 'zod';
import { UnauthorizedError, ForbiddenError } from '../middlewares/error.middleware.js';
import { lemonSqueezyService } from '../services/lemonSqueezy.service.js';
import { logger } from '../lib/logger.js';

const checkoutSchema = z.object({
  interval: z.enum(['monthly', 'annual']).default('monthly'),
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
};
