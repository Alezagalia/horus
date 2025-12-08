import dotenv from 'dotenv';
import { z } from 'zod';

// Only load .env file in development (Railway injects env vars directly)
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

// Debug: log available env vars (without values for security)
console.log(
  'Available env vars:',
  Object.keys(process.env).filter((k) => !k.startsWith('npm_'))
);

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
  ENCRYPTION_KEY: z.string().optional(), // For encrypting tokens (32 bytes hex)
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
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('Invalid environment variables:', parsedEnv.error.format());
  process.exit(1);
}

export const env = parsedEnv.data;
