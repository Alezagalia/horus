import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { UnauthorizedError } from '../middlewares/error.middleware.js';
import { entitlementsService } from '../services/entitlements.service.js';

export const subscriptionController = {
  /**
   * GET /api/subscription
   * Returns the user's effective plan, limits, feature flags and the raw
   * subscription state (for "trial ends", "renews on", "past due" UI).
   */
  async getMine(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('User not found');

      const [entitlements, subscription] = await Promise.all([
        entitlementsService.getEntitlements(req.user.id),
        prisma.subscription.findUnique({
          where: { userId: req.user.id },
          select: {
            plan: true,
            status: true,
            provider: true,
            currentPeriodEnd: true,
            cancelAtPeriodEnd: true,
            trialEndsAt: true,
          },
        }),
      ]);

      res.status(200).json({
        plan: entitlements.plan,
        limits: entitlements.limits,
        features: entitlements.features,
        subscription, // null for users that never subscribed (effectively Free)
      });
    } catch (error) {
      next(error);
    }
  },
};
