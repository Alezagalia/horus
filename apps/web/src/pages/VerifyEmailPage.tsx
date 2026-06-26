/**
 * Verify Email Page (S-01.3)
 *
 * Consumes the token from the URL (?token=...) and confirms the user's email.
 * Verification is non-blocking, so this page is reachable whether or not the
 * user is logged in. On success, if there's an active session we refresh the
 * user so the verification banner disappears.
 */

import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/stores/authStore';

type Status = 'verifying' | 'success' | 'error';

export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const checkAuth = useAuthStore((s) => s.checkAuth);

  const [status, setStatus] = useState<Status>(token ? 'verifying' : 'error');
  const [message, setMessage] = useState<string>(
    token ? '' : 'Este link no incluye un token de verificación.'
  );
  // Guard against double-invocation (React 18 StrictMode mounts twice in dev).
  const ranRef = useRef(false);

  useEffect(() => {
    if (!token || ranRef.current) return;
    ranRef.current = true;

    (async () => {
      try {
        await authService.verifyEmail(token);
        setStatus('success');
        if (isAuthenticated) {
          // Refresh the cached user so the banner clears immediately.
          await checkAuth();
        }
      } catch (err) {
        const e = err as { response?: { data?: { message?: string } } };
        setMessage(
          e.response?.data?.message ||
            'No pudimos verificar tu email. El link puede haber expirado.'
        );
        setStatus('error');
      }
    })();
  }, [token, isAuthenticated, checkAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full">
        {status === 'verifying' && (
          <div className="rounded-xl bg-white border border-gray-200 p-8 text-center shadow-sm">
            <div className="text-4xl mb-3">⏳</div>
            <h2 className="text-lg font-semibold text-gray-900">Verificando tu email…</h2>
          </div>
        )}

        {status === 'success' && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-8 text-center">
            <div className="text-4xl mb-3">✅</div>
            <h2 className="text-lg font-semibold text-emerald-900 mb-1">Email verificado</h2>
            <p className="text-sm text-emerald-700 mb-4">¡Listo! Tu dirección quedó confirmada.</p>
            <Link
              to={isAuthenticated ? '/' : '/login'}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              {isAuthenticated ? 'Ir al inicio' : 'Ir al login'}
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-8 text-center">
            <div className="text-4xl mb-3">⚠️</div>
            <h2 className="text-base font-semibold text-amber-900 mb-1">No pudimos verificar</h2>
            <p className="text-sm text-amber-700 mb-4">{message}</p>
            <Link
              to={isAuthenticated ? '/' : '/login'}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              {isAuthenticated ? 'Volver al inicio' : 'Ir al login'}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
