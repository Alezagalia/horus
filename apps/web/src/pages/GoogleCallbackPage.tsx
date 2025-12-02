/**
 * Google Calendar OAuth Callback Page
 * Sprint 13 - US-118
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { axiosInstance } from '@/lib/axios';

export function GoogleCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Procesando autenticación...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        // Handle OAuth error
        if (error) {
          setStatus('error');
          setMessage(
            error === 'access_denied'
              ? 'Acceso denegado. No se conectó Google Calendar.'
              : 'Error en la autenticación con Google.'
          );

          // Notify parent window
          if (window.opener) {
            window.opener.postMessage(
              { type: 'google-calendar-error', error },
              window.location.origin
            );
          }

          // Close popup after delay
          setTimeout(() => {
            window.close();
          }, 2000);
          return;
        }

        // Validate required params
        if (!code || !state) {
          setStatus('error');
          setMessage('Parámetros de autenticación inválidos.');

          if (window.opener) {
            window.opener.postMessage(
              { type: 'google-calendar-error', error: 'invalid_params' },
              window.location.origin
            );
          }

          setTimeout(() => {
            window.close();
          }, 2000);
          return;
        }

        // Exchange code for tokens via backend
        await axiosInstance.get(
          `/sync/google-calendar/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`
        );

        setStatus('success');
        setMessage('¡Conectado exitosamente! Cerrando...');

        // Notify parent window of success
        if (window.opener) {
          window.opener.postMessage({ type: 'google-calendar-connected' }, window.location.origin);
        }

        // Close popup after success
        setTimeout(() => {
          if (window.opener) {
            window.close();
          } else {
            // If not a popup, redirect to calendar
            navigate('/calendar');
          }
        }, 1500);
      } catch (error) {
        console.error('Error handling Google Calendar callback:', error);
        setStatus('error');
        setMessage('Error al conectar con Google Calendar.');

        if (window.opener) {
          window.opener.postMessage(
            { type: 'google-calendar-error', error: 'callback_failed' },
            window.location.origin
          );
        }

        setTimeout(() => {
          window.close();
        }, 2000);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Conectando...</h2>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-10 h-10 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-green-900 mb-2">¡Éxito!</h2>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-10 h-10 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-red-900 mb-2">Error</h2>
            <p className="text-gray-600">{message}</p>
          </>
        )}
      </div>
    </div>
  );
}
