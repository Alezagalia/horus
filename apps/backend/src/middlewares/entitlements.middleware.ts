/**
 * Entitlement gating middleware (S-03)
 *
 * - requireFeature(feature): blocks Free users from a Pro-only feature.
 * - enforceLimit(resource): blocks Free users who are at their plan limit for a
 *   resource they're about to create.
 *
 * Both run AFTER authMiddleware (they rely on req.user). They throw
 * PaymentRequiredError (402) with a `code` so the client can show the right
 * paywall.
 */

import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError, PaymentRequiredError } from './error.middleware.js';
import { env } from '../config/env.js';
import {
  entitlementsService,
  type GatedFeature,
  type LimitedResource,
} from '../services/entitlements.service.js';

/** Gating is inert until billing is live (see env.BILLING_ENFORCED). */
const enforced = (): boolean => env.BILLING_ENFORCED === 'true';

export function requireFeature(feature: GatedFeature) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!enforced()) return next();
      if (!req.user) throw new UnauthorizedError('User not found');
      const allowed = await entitlementsService.hasFeature(req.user.id, feature);
      if (!allowed) {
        throw new PaymentRequiredError(`Esta función requiere el plan Pro.`, {
          code: 'PRO_FEATURE',
          feature,
        });
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function enforceLimit(resource: LimitedResource) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!enforced()) return next();
      if (!req.user) throw new UnauthorizedError('User not found');
      await entitlementsService.assertWithinLimit(req.user.id, resource);
      next();
    } catch (error) {
      next(error);
    }
  };
}
