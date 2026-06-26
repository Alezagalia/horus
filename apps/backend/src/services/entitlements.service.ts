/**
 * Entitlements Service (S-03)
 *
 * Single source of truth for "what can this user do on their plan". Resolves the
 * EFFECTIVE plan from the Subscription row (absence of row = FREE) and exposes:
 *  - getEntitlements(userId): plan + limits + feature flags
 *  - hasFeature(userId, feature)
 *  - assertWithinLimit(userId, resource): throws PaymentRequiredError when a FREE
 *    user is at/over the limit for a resource they're about to create.
 *
 * The Free/Pro split here is the product hypothesis from the commercialization
 * analysis (§3.1) and can be tuned without touching call sites.
 */

import { prisma } from '../lib/prisma.js';
import { PaymentRequiredError } from '../middlewares/error.middleware.js';
import type { Plan, SubStatus } from '../generated/prisma/client.js';

export type LimitedResource = 'habits' | 'goals' | 'accounts';
export type GatedFeature = 'calendarSync' | 'nutrition' | 'fitness' | 'advancedStats';

interface PlanConfig {
  limits: Record<LimitedResource, number>; // Infinity = unlimited
  features: Record<GatedFeature, boolean>;
}

export const PLAN_LIMITS: Record<Plan, PlanConfig> = {
  FREE: {
    limits: { habits: 5, goals: 1, accounts: 1 },
    features: { calendarSync: false, nutrition: false, fitness: false, advancedStats: false },
  },
  PRO: {
    limits: { habits: Infinity, goals: Infinity, accounts: Infinity },
    features: { calendarSync: true, nutrition: true, fitness: true, advancedStats: true },
  },
};

interface EffectiveSub {
  plan: Plan;
  status: SubStatus;
  currentPeriodEnd: Date | null;
}

/** Resolves the effective plan from a subscription row (or its absence). */
export function resolvePlan(sub: EffectiveSub | null): Plan {
  if (!sub || sub.plan !== 'PRO') return 'FREE';

  const now = Date.now();
  const withinPeriod = sub.currentPeriodEnd ? sub.currentPeriodEnd.getTime() > now : false;

  if (sub.status === 'ACTIVE' || sub.status === 'TRIALING') return 'PRO';
  // Canceled or past-due users keep Pro until the paid period actually ends.
  if ((sub.status === 'CANCELED' || sub.status === 'PAST_DUE') && withinPeriod) return 'PRO';

  return 'FREE';
}

export async function getPlan(userId: string): Promise<Plan> {
  const sub = await prisma.subscription.findUnique({
    where: { userId },
    select: { plan: true, status: true, currentPeriodEnd: true },
  });
  return resolvePlan(sub);
}

export async function getEntitlements(userId: string): Promise<{
  plan: Plan;
  limits: Record<LimitedResource, number>;
  features: Record<GatedFeature, boolean>;
}> {
  const plan = await getPlan(userId);
  return { plan, limits: PLAN_LIMITS[plan].limits, features: PLAN_LIMITS[plan].features };
}

export async function hasFeature(userId: string, feature: GatedFeature): Promise<boolean> {
  const plan = await getPlan(userId);
  return PLAN_LIMITS[plan].features[feature];
}

/** Counts how many of `resource` the user currently owns (active rows). */
async function countUsage(userId: string, resource: LimitedResource): Promise<number> {
  switch (resource) {
    case 'habits':
      return prisma.habit.count({ where: { userId, isActive: true } });
    case 'goals':
      return prisma.goal.count({ where: { userId, status: 'en_progreso' } });
    case 'accounts':
      return prisma.account.count({ where: { userId, isActive: true } });
  }
}

/**
 * Throws PaymentRequiredError if creating one more `resource` would exceed the
 * user's plan limit. No-op for unlimited (Pro) plans.
 */
export async function assertWithinLimit(userId: string, resource: LimitedResource): Promise<void> {
  const plan = await getPlan(userId);
  const limit = PLAN_LIMITS[plan].limits[resource];
  if (!Number.isFinite(limit)) return;

  const used = await countUsage(userId, resource);
  if (used >= limit) {
    throw new PaymentRequiredError(
      `Alcanzaste el límite del plan ${plan} para ${resource} (${limit}). Pasá a Pro para más.`,
      { code: 'PLAN_LIMIT', resource, plan, limit }
    );
  }
}

export const entitlementsService = {
  resolvePlan,
  getPlan,
  getEntitlements,
  hasFeature,
  assertWithinLimit,
  PLAN_LIMITS,
};
