import dotenv from 'dotenv';
import { z } from 'zod';

// Only load .env file in development (Railway injects env vars directly)
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  JWT_REFRESH_SECRET: z.string().min(1, 'JWT_REFRESH_SECRET is required'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  // Google OAuth2 (Sprint 8 - US-067)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().optional(),
  // Redirect URI del flujo OAuth mobile: apunta al endpoint del API (no a la SPA)
  // para que el backend haga el exchange y responda 302 → horus://. Si no se
  // setea, se deriva de FRONTEND_URL (válido en prod, donde el backend sirve la web).
  GOOGLE_MOBILE_REDIRECT_URI: z.string().optional(),
  // Google Sign-In (login social): client IDs aceptados como audience del
  // id_token, separados por coma (Web client ID + extras). Si falta, se usa
  // GOOGLE_CLIENT_ID como fallback.
  GOOGLE_SIGNIN_CLIENT_IDS: z.string().optional(),
  // AES-256-GCM key for token encryption: must be exactly 64 hex chars (32 bytes).
  // Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  // MUST remain the same across deployments — changing it invalidates all stored tokens.
  ENCRYPTION_KEY: z
    .string()
    .min(
      64,
      "ENCRYPTION_KEY must be a 64-char hex string (32 bytes). Generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    ),
  // Microsoft OAuth2 (Sprint 15 - Multi-Calendar)
  MICROSOFT_CLIENT_ID: z.string().optional(),
  MICROSOFT_CLIENT_SECRET: z.string().optional(),
  MICROSOFT_REDIRECT_URI: z.string().optional(),
  // Firebase Cloud Messaging (Sprint 12 - US-105)
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  // Web Push VAPID Keys (Sprint 12 - US-107)
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  // Security Configuration
  CORS_ORIGINS: z.string().optional(), // Comma-separated list of allowed origins
  RATE_LIMIT_WINDOW_MS: z.string().default('900000'), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100'), // Max requests per window
  RATE_LIMIT_AUTH_MAX: z.string().default('5'), // Max auth attempts per window
  // Password reset / transactional email
  // If RESEND_API_KEY is missing, the email service falls back to logging the
  // reset link to the console (dev mode). EMAIL_FROM defaults to Resend's
  // sandbox sender; replace with a verified domain in production.
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default('Horus <onboarding@resend.dev>'),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  // Data retention (S-02.4). Expired auth tokens are always purged. Inactive
  // accounts are only DELETED when both: the threshold (days) is > 0 AND the
  // enable flag is 'true'. Otherwise the job runs in dry-run (logs only) so it
  // can never silently mass-delete real accounts.
  INACTIVE_ACCOUNT_PURGE_DAYS: z.string().default('0'),
  INACTIVE_ACCOUNT_PURGE_ENABLED: z.string().default('false'),
  // Plan gating (S-03). When 'false' (default) the entitlement middleware is a
  // no-op, so plan limits / Pro features do NOT block anyone yet. Flip to 'true'
  // once billing (Fase 2) is live, otherwise current users would be capped at
  // Free limits with no way to upgrade.
  BILLING_ENFORCED: z.string().default('false'),
  // Lemon Squeezy (Merchant of Record) — S-04. All optional so the app boots
  // without billing configured; the checkout endpoint 503s until they are set.
  LEMONSQUEEZY_API_KEY: z.string().optional(),
  LEMONSQUEEZY_STORE_ID: z.string().optional(),
  LEMONSQUEEZY_WEBHOOK_SECRET: z.string().optional(),
  LEMONSQUEEZY_VARIANT_PRO_MONTHLY: z.string().optional(),
  LEMONSQUEEZY_VARIANT_PRO_ANNUAL: z.string().optional(),
  // Google Play in-app subscriptions (mobile) — S-05. All optional so the app
  // boots without billing configured; the verify endpoint 503s until set.
  // SERVICE_ACCOUNT_JSON is the full service-account credentials JSON (one line).
  GOOGLE_PLAY_PACKAGE_NAME: z.string().optional(),
  GOOGLE_PLAY_SERVICE_ACCOUNT_JSON: z.string().optional(),
  GOOGLE_PLAY_PRODUCT_PRO_MONTHLY: z.string().optional(),
  GOOGLE_PLAY_PRODUCT_PRO_ANNUAL: z.string().optional(),
  // Shared secret guarding the RTDN push endpoint (passed as ?secret=).
  GOOGLE_PLAY_RTDN_SECRET: z.string().optional(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('Invalid environment variables:', parsedEnv.error.format());
  process.exit(1);
}

export const env = parsedEnv.data;
