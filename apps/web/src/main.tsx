/**
 * Application Entry Point
 * Sprint 11 - US-095
 * Sprint 12 - US-109: Performance optimizations
 * Sprint 12 - US-115: Monitoring y Logging
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App } from './App';
import './index.css';
import { initSentry } from './lib/sentry';
import { ErrorBoundary } from './components/ErrorBoundary';

// Initialize Sentry first (US-115)
initSentry();

// Configure TanStack Query with performance optimizations (US-109)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2, // Increased from 1 for better reliability
      refetchOnWindowFocus: false, // Disabled to reduce network calls
      refetchOnMount: false, // Don't refetch on mount if data is fresh
      refetchOnReconnect: true, // Refetch on network reconnection
      staleTime: 10 * 60 * 1000, // 10 minutes (increased from 5min)
      gcTime: 60 * 60 * 1000, // 60 minutes - cache garbage collection
      // Performance optimizations (US-109)
      networkMode: 'online', // Only run queries when online
    },
    mutations: {
      retry: 1,
      networkMode: 'online',
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
