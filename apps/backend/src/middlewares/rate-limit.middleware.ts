/**
 * Rate Limiting Middleware
 * Protects against brute force and DoS attacks
 */

import rateLimit, { type RateLimitRequestHandler } from 'express-rate-limit';
import type { RequestHandler } from 'express';
import {
  getGeneralRateLimitOptions,
  getAuthRateLimitOptions,
} from '../config/security.js';

/**
 * General rate limiter for all API routes
 * Generous limits for normal usage
 */
export const generalLimiter = rateLimit(
  getGeneralRateLimitOptions()
) as unknown as RequestHandler;

/**
 * Strict rate limiter for authentication endpoints
 * Prevents brute force attacks on login/register
 */
export const authLimiter = rateLimit(
  getAuthRateLimitOptions()
) as unknown as RequestHandler;

/**
 * Very strict limiter for password reset
 * Only 3 attempts per hour
 */
export const passwordResetLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: {
    error: 'Too many password reset attempts, please try again in an hour',
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Limiter for sensitive operations (account deletion, etc.)
 * 5 attempts per hour
 */
export const sensitiveLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: {
    error: 'Too many attempts for this operation, please try again later',
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
});
