/**
 * Sentry Configuration for Web
 * Sprint 12 - US-115: Monitoring y Logging en Producción
 */

import * as Sentry from '@sentry/react';

export const initSentry = () => {
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  if (!dsn) {
    console.warn('Sentry DSN not configured. Error tracking disabled.');
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE || 'development',

    // Performance Monitoring
    tracesSampleRate: parseFloat(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || '0.1'),

    // Session Replay (optional)
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

    // Release tracking
    release: import.meta.env.VITE_APP_VERSION || '1.0.0',

    // Before send hook
    beforeSend(event) {
      // Don't send events in development unless explicitly enabled
      if (import.meta.env.DEV && !import.meta.env.VITE_SENTRY_SEND_IN_DEV) {
        console.log('Sentry event (dev mode):', event);
        return null;
      }

      // Filter out localhost errors in production
      if (event.request?.url?.includes('localhost')) {
        return null;
      }

      return event;
    },
  });

  console.log('Sentry initialized for web', {
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE,
    tracesSampleRate: parseFloat(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || '0.1'),
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

  console.error('Exception captured:', error, context);
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
  console.log('Sentry message captured:', message, level);
};

// Export Sentry for ErrorBoundary usage
export { Sentry };
