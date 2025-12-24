/**
 * Security Configuration
 * Centralizes all security-related middleware configuration
 */

import { CorsOptions } from 'cors';
import { Options as RateLimitOptions } from 'express-rate-limit';
import { env } from './env.js';

/**
 * CORS Configuration
 * In production, only allows requests from specified origins
 * In development, allows localhost origins
 */
export const getCorsOptions = (): CorsOptions => {
  const isProduction = env.NODE_ENV === 'production';

  // Default development origins
  const devOrigins = [
    'http://localhost:5173', // Vite dev server
    'http://localhost:5174', // Vite dev server (alternative port)
    'http://localhost:3000', // Alternative dev port
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:3000',
  ];

  // Production origins from environment variable
  const prodOrigins = env.CORS_ORIGINS
    ? env.CORS_ORIGINS.split(',').map((origin) => origin.trim())
    : [];

  const allowedOrigins = isProduction ? prodOrigins : [...devOrigins, ...prodOrigins];

  return {
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, curl, etc.)
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.length === 0 && isProduction) {
        // If no origins configured in production, reject all browser requests
        callback(new Error('CORS not configured for production'), false);
        return;
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`), false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Per-Page'],
    maxAge: 86400, // 24 hours - browsers can cache preflight requests
  };
};

/**
 * General Rate Limit Configuration
 * Applies to all routes - generous limits for normal usage
 */
export const getGeneralRateLimitOptions = (): Partial<RateLimitOptions> => ({
  windowMs: parseInt(env.RATE_LIMIT_WINDOW_MS, 10), // Default: 15 minutes
  max: parseInt(env.RATE_LIMIT_MAX_REQUESTS, 10), // Default: 100 requests per window
  message: {
    error: 'Too many requests, please try again later',
    retryAfter: Math.ceil(parseInt(env.RATE_LIMIT_WINDOW_MS, 10) / 1000 / 60), // minutes
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
});

/**
 * Auth Rate Limit Configuration
 * Strict limits for authentication endpoints to prevent brute force attacks
 */
export const getAuthRateLimitOptions = (): Partial<RateLimitOptions> => ({
  windowMs: parseInt(env.RATE_LIMIT_WINDOW_MS, 10), // Default: 15 minutes
  max: parseInt(env.RATE_LIMIT_AUTH_MAX, 10), // Default: 5 attempts per window
  message: {
    error: 'Too many authentication attempts, please try again later',
    retryAfter: Math.ceil(parseInt(env.RATE_LIMIT_WINDOW_MS, 10) / 1000 / 60),
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failed attempts
  skipFailedRequests: false,
});

/**
 * Helmet Configuration
 * Security headers for protection against common vulnerabilities
 */
export const helmetOptions = {
  // Content Security Policy - adjust based on your frontend needs
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles (common in React)
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", 'https:', 'data:'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  // Cross-Origin settings
  crossOriginEmbedderPolicy: false, // Disable if you need to load external resources
  crossOriginOpenerPolicy: { policy: 'same-origin' as const },
  crossOriginResourcePolicy: { policy: 'cross-origin' as const }, // Allow cross-origin for API
  // DNS Prefetch Control
  dnsPrefetchControl: { allow: false },
  // Frameguard - prevent clickjacking
  frameguard: { action: 'deny' as const },
  // Hide X-Powered-By header
  hidePoweredBy: true,
  // HSTS - enforce HTTPS (only in production)
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  // IE No Open - prevent IE from executing downloads
  ieNoOpen: true,
  // No Sniff - prevent MIME type sniffing
  noSniff: true,
  // Origin Agent Cluster
  originAgentCluster: true,
  // Permitted Cross-Domain Policies
  permittedCrossDomainPolicies: { permittedPolicies: 'none' as const },
  // Referrer Policy
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' as const },
  // XSS Filter (legacy, but doesn't hurt)
  xssFilter: true,
};

/**
 * API-specific Helmet options (less restrictive CSP for API-only server)
 */
export const apiHelmetOptions = {
  ...helmetOptions,
  contentSecurityPolicy: false, // APIs typically don't need CSP
};
