/**
 * Sentry Configuration for Backend
 * Sprint 12 - US-115: Monitoring y Logging en Producción
 */

import * as Sentry from '@sentry/node';
import { logger } from './logger.js';

export const initSentry = () => {
  const dsn = process.env.SENTRY_DSN;

  if (!dsn) {
    logger.warn('Sentry DSN not configured. Error tracking disabled.');
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',

    // Performance Monitoring
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),

    // Before send hook for filtering
    beforeSend(event) {
      // Don't send events in development unless explicitly enabled
      if (process.env.NODE_ENV === 'development' && !process.env.SENTRY_SEND_IN_DEV) {
        return null;
      }

      // Log to Winston as well
      logger.error('Sentry event captured', {
        eventId: event.event_id,
      });

      return event;
    },
  });

  logger.info('Sentry initialized', {
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV,
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
  });
};

// Helper to capture exceptions with context
export const captureException = (error: Error, context?: Record<string, any>) => {
  Sentry.withScope((scope) => {
    if (context) {
      Object.keys(context).forEach((key) => {
        scope.setContext(key, context[key]);
      });
    }
    Sentry.captureException(error);
  });

  logger.error('Exception captured', { error, context });
};

// Helper to set user context
export const setUser = (user: { id: string; email?: string; username?: string }) => {
  Sentry.setUser(user);
};

// Helper to clear user context (on logout)
export const clearUser = () => {
  Sentry.setUser(null);
};

// Helper to add breadcrumb
export const addBreadcrumb = (message: string, category: string, data?: Record<string, any>) => {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
    timestamp: Date.now() / 1000,
  });
};

// Helper to capture message
export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info') => {
  Sentry.captureMessage(message, level);
  logger.info('Sentry message captured', { message, level });
};

// Export Sentry instance for middleware usage
export { Sentry };
