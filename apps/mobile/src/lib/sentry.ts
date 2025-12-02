/**
 * Sentry Configuration for Mobile
 * Sprint 12 - US-115: Monitoring y Logging en Producción
 */

import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

export const initSentry = () => {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

  if (!dsn) {
    console.warn('Sentry DSN not configured. Crash reporting disabled.');
    return;
  }

  Sentry.init({
    dsn,
    environment:
      process.env.EXPO_PUBLIC_SENTRY_ENVIRONMENT || __DEV__ ? 'development' : 'production',

    // Performance Monitoring
    tracesSampleRate: parseFloat(process.env.EXPO_PUBLIC_SENTRY_TRACES_SAMPLE_RATE || '0.1'),

    // Enable automatic tracking
    enableAutoSessionTracking: true,
    sessionTrackingIntervalMillis: 30000, // 30 seconds

    // Native crashes
    enableNativeCrashHandling: true,

    // Release tracking
    release: Constants.expoConfig?.version || '1.0.0',
    dist:
      Constants.expoConfig?.ios?.buildNumber ||
      Constants.expoConfig?.android?.versionCode?.toString(),

    // Before send hook
    beforeSend(event) {
      // Don't send events in development unless explicitly enabled
      if (__DEV__ && !process.env.EXPO_PUBLIC_SENTRY_SEND_IN_DEV) {
        console.log('Sentry event (dev mode):', event);
        return null;
      }

      return event;
    },
  });

  console.log('Sentry initialized for mobile', {
    environment:
      process.env.EXPO_PUBLIC_SENTRY_ENVIRONMENT || (__DEV__ ? 'development' : 'production'),
    release: Constants.expoConfig?.version,
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

// Export Sentry for navigation integration
export { Sentry };
