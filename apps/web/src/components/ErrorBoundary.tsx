/**
 * Error Boundary Component
 * Sprint 12 - US-115: Monitoring y Logging en Producción
 */

import React, { Component, ReactNode } from 'react';
import { Sentry } from '../lib/sentry';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to Sentry
    Sentry.withScope((scope) => {
      scope.setContext('errorInfo', {
        componentStack: errorInfo.componentStack,
      });
      Sentry.captureException(error);
    });

    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '20px',
            textAlign: 'center',
          }}
        >
          <h1 style={{ fontSize: '24px', marginBottom: '16px', color: '#dc2626' }}>
            Algo salió mal
          </h1>
          <p style={{ marginBottom: '24px', color: '#6b7280' }}>
            Lo sentimos, ha ocurrido un error inesperado.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            Recargar página
          </button>
          {import.meta.env.DEV && this.state.error && (
            <pre
              style={{
                marginTop: '24px',
                padding: '16px',
                backgroundColor: '#f3f4f6',
                borderRadius: '4px',
                textAlign: 'left',
                overflow: 'auto',
                maxWidth: '600px',
              }}
            >
              {this.state.error.toString()}
              {'\n\n'}
              {this.state.error.stack}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
