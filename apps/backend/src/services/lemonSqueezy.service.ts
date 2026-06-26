/**
 * Lemon Squeezy billing service (S-04)
 *
 * Lemon Squeezy is a Merchant of Record: it runs the checkout, charges the
 * customer and handles global sales tax/VAT, then notifies us via webhooks. We
 * keep our `Subscription` row in sync from those webhooks.
 *
 * All credentials are optional env vars so the app boots without billing
 * configured; createCheckout throws a 503 until they are set, and the webhook
 * rejects when the signing secret is missing.
 */

import { createHmac, timingSafeEqual } from 'crypto';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { logger } from '../lib/logger.js';
import { HttpError } from '../middlewares/error.middleware.js';
import type { SubStatus, SubProvider } from '../generated/prisma/client.js';

const API_BASE = 'https://api.lemonsqueezy.com/v1';
const PROVIDER: SubProvider = 'LEMON_SQUEEZY';

export type ProInterval = 'monthly' | 'annual';

export function isConfigured(): boolean {
  return Boolean(env.LEMONSQUEEZY_API_KEY && env.LEMONSQUEEZY_STORE_ID);
}

function variantFor(interval: ProInterval): string | undefined {
  return interval === 'annual'
    ? env.LEMONSQUEEZY_VARIANT_PRO_ANNUAL
    : env.LEMONSQUEEZY_VARIANT_PRO_MONTHLY;
}

/**
 * Creates a hosted checkout for the Pro plan and returns its URL. The user id is
 * embedded as custom data so the webhook can attribute the subscription.
 */
export async function createCheckout(args: {
  userId: string;
  email: string;
  interval: ProInterval;
}): Promise<{ url: string }> {
  if (!isConfigured()) {
    throw new HttpError(503, 'Billing no está configurado todavía.');
  }
  const variantId = variantFor(args.interval);
  if (!variantId) {
    throw new HttpError(503, `No hay variante configurada para el plan ${args.interval}.`);
  }

  const body = {
    data: {
      type: 'checkouts',
      attributes: {
        checkout_data: {
          email: args.email,
          custom: { user_id: args.userId },
        },
      },
      relationships: {
        store: { data: { type: 'stores', id: String(env.LEMONSQUEEZY_STORE_ID) } },
        variant: { data: { type: 'variants', id: String(variantId) } },
      },
    },
  };

  const res = await fetch(`${API_BASE}/checkouts`, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json',
      Authorization: `Bearer ${env.LEMONSQUEEZY_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    logger.error('[lemonSqueezy] checkout creation failed', { status: res.status, text });
    throw new HttpError(502, 'No se pudo iniciar el checkout.');
  }

  const json = (await res.json()) as { data?: { attributes?: { url?: string } } };
  const url = json.data?.attributes?.url;
  if (!url) throw new HttpError(502, 'Checkout sin URL.');

  return { url };
}

/** Verifies the X-Signature header (HMAC-SHA256 hex of the raw body). */
export function verifyWebhookSignature(rawBody: Buffer, signature: string | undefined): boolean {
  if (!env.LEMONSQUEEZY_WEBHOOK_SECRET || !signature) return false;

  const expected = createHmac('sha256', env.LEMONSQUEEZY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');

  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(signature, 'utf8');
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Maps a Lemon Squeezy subscription status to our internal status. */
export function mapStatus(lsStatus: string): SubStatus {
  switch (lsStatus) {
    case 'on_trial':
      return 'TRIALING';
    case 'active':
      return 'ACTIVE';
    case 'past_due':
    case 'unpaid':
      return 'PAST_DUE';
    case 'cancelled':
      return 'CANCELED';
    case 'paused':
    case 'expired':
    default:
      return 'EXPIRED';
  }
}

interface LsWebhook {
  meta?: { event_name?: string; custom_data?: { user_id?: string } };
  data?: {
    id?: string;
    attributes?: {
      status?: string;
      customer_id?: number | string;
      renews_at?: string | null;
      ends_at?: string | null;
      trial_ends_at?: string | null;
      cancelled?: boolean;
    };
  };
}

/**
 * Applies a verified subscription webhook to our Subscription row. Idempotent:
 * upserts by userId. Returns false for events we don't handle.
 */
export async function applyWebhookEvent(payload: LsWebhook): Promise<boolean> {
  const event = payload.meta?.event_name ?? '';
  if (!event.startsWith('subscription_')) return false;
  // Payment-only events carry no subscription status changes we need here.
  if (event.startsWith('subscription_payment_')) return true;

  const attrs = payload.data?.attributes;
  if (!attrs?.status) return false;

  // Resolve the owner: prefer custom_data, fall back to an existing row keyed by
  // the provider subscription id (later events may omit custom data).
  let userId = payload.meta?.custom_data?.user_id;
  const providerSubscriptionId = payload.data?.id ? String(payload.data.id) : undefined;

  if (!userId && providerSubscriptionId) {
    const existing = await prisma.subscription.findFirst({
      where: { providerSubscriptionId },
      select: { userId: true },
    });
    userId = existing?.userId;
  }
  if (!userId) {
    logger.warn('[lemonSqueezy] webhook without resolvable user', {
      event,
      providerSubscriptionId,
    });
    return false;
  }

  const status = mapStatus(attrs.status);
  const currentPeriodEnd = attrs.ends_at ?? attrs.renews_at ?? null;

  const data = {
    plan: 'PRO' as const,
    status,
    provider: PROVIDER,
    providerCustomerId: attrs.customer_id != null ? String(attrs.customer_id) : null,
    providerSubscriptionId: providerSubscriptionId ?? null,
    currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd) : null,
    cancelAtPeriodEnd: Boolean(attrs.cancelled),
    trialEndsAt: attrs.trial_ends_at ? new Date(attrs.trial_ends_at) : null,
  };

  await prisma.subscription.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });

  logger.info('[lemonSqueezy] subscription synced', { userId, event, status });
  return true;
}

export const lemonSqueezyService = {
  isConfigured,
  createCheckout,
  verifyWebhookSignature,
  mapStatus,
  applyWebhookEvent,
};
