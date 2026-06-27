/**
 * Google Play billing service (S-05)
 *
 * Mobile cannot use Lemon Squeezy: Play Store policy requires in-app purchases
 * for digital goods. The flow is:
 *   1. The app buys the Pro subscription via Google Play Billing (react-native-iap)
 *      and gets a `purchaseToken`.
 *   2. The app POSTs that token to /api/billing/google/verify, where we validate
 *      it against the Google Play Developer API and upsert our Subscription row.
 *   3. Renewals / cancellations / refunds arrive later as Real-Time Developer
 *      Notifications (RTDN) on a Pub/Sub topic that pushes to
 *      /api/billing/google/rtdn; we re-verify and re-sync.
 *
 * All credentials are optional env vars so the app boots without billing
 * configured; verifyPurchase throws 503 until they are set.
 */

import { google, type androidpublisher_v3 } from 'googleapis';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { logger } from '../lib/logger.js';
import { HttpError } from '../middlewares/error.middleware.js';
import { resolvePlan } from './entitlements.service.js';
import type { SubStatus, SubProvider, Plan } from '../generated/prisma/client.js';

const PROVIDER: SubProvider = 'GOOGLE_PLAY';
const ANDROID_PUBLISHER_SCOPE = 'https://www.googleapis.com/auth/androidpublisher';

export type ProInterval = 'monthly' | 'annual';

export function isConfigured(): boolean {
  return Boolean(env.GOOGLE_PLAY_PACKAGE_NAME && env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON);
}

/** The Pro subscription product ids we accept (configured in Play Console). */
function allowedProductIds(): string[] {
  return [env.GOOGLE_PLAY_PRODUCT_PRO_MONTHLY, env.GOOGLE_PLAY_PRODUCT_PRO_ANNUAL].filter(
    (v): v is string => Boolean(v)
  );
}

let cachedClient: androidpublisher_v3.Androidpublisher | null = null;

/** Lazily builds (and caches) an authenticated Android Publisher client. */
function getPublisher(): androidpublisher_v3.Androidpublisher {
  if (cachedClient) return cachedClient;
  if (!env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON) {
    throw new HttpError(503, 'Google Play billing no está configurado todavía.');
  }
  let credentials: { client_email?: string; private_key?: string };
  try {
    credentials = JSON.parse(env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON);
  } catch {
    throw new HttpError(500, 'GOOGLE_PLAY_SERVICE_ACCOUNT_JSON no es un JSON válido.');
  }
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: [ANDROID_PUBLISHER_SCOPE],
  });
  cachedClient = google.androidpublisher({ version: 'v3', auth });
  return cachedClient;
}

/** Test seam: lets unit tests inject a mock publisher and reset between cases. */
export function __setPublisherForTest(client: androidpublisher_v3.Androidpublisher | null): void {
  cachedClient = client;
}

/**
 * Maps a Google Play SubscriptionPurchaseV2 `subscriptionState` to our status.
 * Access (PRO vs FREE) is ultimately decided by entitlements.resolvePlan using
 * status + currentPeriodEnd, so e.g. CANCELED keeps Pro until the period ends.
 */
export function mapSubscriptionState(state: string | null | undefined): SubStatus {
  switch (state) {
    case 'SUBSCRIPTION_STATE_ACTIVE':
      return 'ACTIVE';
    case 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD':
    case 'SUBSCRIPTION_STATE_ON_HOLD':
      return 'PAST_DUE';
    case 'SUBSCRIPTION_STATE_CANCELED':
      return 'CANCELED';
    case 'SUBSCRIPTION_STATE_PENDING':
      // First payment not completed yet — don't grant access.
      return 'EXPIRED';
    case 'SUBSCRIPTION_STATE_PAUSED':
    case 'SUBSCRIPTION_STATE_EXPIRED':
    default:
      return 'EXPIRED';
  }
}

interface SyncResult {
  plan: Plan;
  status: SubStatus;
  currentPeriodEnd: Date | null;
}

/**
 * Fetches the live state of a subscription purchase from Google, acknowledges it
 * if needed, and upserts our Subscription row for `userId`. Idempotent.
 */
async function syncFromPlay(args: {
  userId: string;
  productId: string;
  purchaseToken: string;
}): Promise<SyncResult> {
  const publisher = getPublisher();
  const packageName = env.GOOGLE_PLAY_PACKAGE_NAME as string;

  const { data: purchase } = await publisher.purchases.subscriptionsv2.get({
    packageName,
    token: args.purchaseToken,
  });

  const state = purchase.subscriptionState ?? undefined;
  const status = mapSubscriptionState(state);

  // Latest expiry across line items (a purchase may bundle multiple).
  const expiryMs = (purchase.lineItems ?? [])
    .map((li) => (li.expiryTime ? new Date(li.expiryTime).getTime() : 0))
    .reduce((max, t) => Math.max(max, t), 0);
  const currentPeriodEnd = expiryMs > 0 ? new Date(expiryMs) : null;

  const cancelAtPeriodEnd = state === 'SUBSCRIPTION_STATE_CANCELED';

  // Acknowledge within 3 days or Google auto-refunds. Best-effort: a failure here
  // must not block granting access the user already paid for.
  if (purchase.acknowledgementState === 'ACKNOWLEDGEMENT_STATE_PENDING') {
    try {
      await publisher.purchases.subscriptions.acknowledge({
        packageName,
        subscriptionId: args.productId,
        token: args.purchaseToken,
        requestBody: {},
      });
    } catch (err) {
      logger.warn('[googlePlay] acknowledge failed (non-fatal)', {
        userId: args.userId,
        error: (err as Error).message,
      });
    }
  }

  const plan = resolvePlan({ plan: 'PRO', status, currentPeriodEnd });

  const data = {
    plan,
    status,
    provider: PROVIDER,
    providerCustomerId: purchase.latestOrderId ?? null,
    providerSubscriptionId: args.purchaseToken,
    currentPeriodEnd,
    cancelAtPeriodEnd,
    trialEndsAt: null,
  };

  await prisma.subscription.upsert({
    where: { userId: args.userId },
    create: { userId: args.userId, ...data },
    update: data,
  });

  logger.info('[googlePlay] subscription synced', {
    userId: args.userId,
    productId: args.productId,
    state,
    plan,
    status,
  });

  return { plan, status, currentPeriodEnd };
}

/**
 * Verifies a purchase initiated by the mobile client and syncs the Subscription.
 * Rejects products we don't sell so a forged token for some other SKU can't grant
 * Pro.
 */
export async function verifyPurchase(args: {
  userId: string;
  productId: string;
  purchaseToken: string;
}): Promise<SyncResult> {
  if (!isConfigured()) {
    throw new HttpError(503, 'Google Play billing no está configurado todavía.');
  }
  const allowed = allowedProductIds();
  if (allowed.length > 0 && !allowed.includes(args.productId)) {
    throw new HttpError(400, `Producto desconocido: ${args.productId}`);
  }

  try {
    return await syncFromPlay(args);
  } catch (err) {
    if (err instanceof HttpError) throw err;
    logger.error('[googlePlay] verifyPurchase failed', {
      userId: args.userId,
      error: (err as Error).message,
    });
    throw new HttpError(502, 'No se pudo verificar la compra con Google Play.');
  }
}

/** A decoded Google Play Real-Time Developer Notification. */
interface DeveloperNotification {
  packageName?: string;
  subscriptionNotification?: {
    notificationType?: number;
    purchaseToken?: string;
    subscriptionId?: string;
  };
  testNotification?: { version?: string };
}

/**
 * Decodes the Pub/Sub push envelope into the Developer Notification. The push
 * body is `{ message: { data: <base64 JSON> }, subscription }`.
 */
export function decodeRtdnMessage(body: unknown): DeveloperNotification | null {
  const data = (body as { message?: { data?: string } })?.message?.data;
  if (!data) return null;
  try {
    return JSON.parse(Buffer.from(data, 'base64').toString('utf8'));
  } catch {
    return null;
  }
}

/**
 * Applies an RTDN. We can only attribute it if a Subscription already exists for
 * the purchaseToken (created when the client verified). Test notifications and
 * unknown tokens are acknowledged (return true) but do nothing.
 */
export async function applyRtdnNotification(body: unknown): Promise<boolean> {
  const notification = decodeRtdnMessage(body);
  if (!notification) return false;

  if (notification.testNotification) {
    logger.info('[googlePlay] RTDN test notification received');
    return true;
  }

  const sub = notification.subscriptionNotification;
  if (!sub?.purchaseToken || !sub.subscriptionId) return true;

  const existing = await prisma.subscription.findFirst({
    where: { providerSubscriptionId: sub.purchaseToken, provider: PROVIDER },
    select: { userId: true },
  });
  if (!existing) {
    logger.warn('[googlePlay] RTDN for unknown purchaseToken', {
      subscriptionId: sub.subscriptionId,
    });
    return true;
  }

  await syncFromPlay({
    userId: existing.userId,
    productId: sub.subscriptionId,
    purchaseToken: sub.purchaseToken,
  });
  return true;
}

export const googlePlayService = {
  isConfigured,
  verifyPurchase,
  mapSubscriptionState,
  decodeRtdnMessage,
  applyRtdnNotification,
  __setPublisherForTest,
};
