/**
 * Email verification banner (S-01.3)
 *
 * Shown across authenticated pages while the logged-in user's email is not yet
 * verified. Verification is non-blocking — this is a gentle nudge, not a gate.
 * Lets the user re-send the verification email.
 */

import { useState } from 'react';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/stores/authStore';

export function EmailVerificationBanner() {
  const user = useAuthStore((s) => s.user);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  // Only nudge verified-less users. If the field is undefined (older sessions
  // before /me exposed it) we stay silent to avoid false positives.
  if (!user || user.emailVerifiedAt !== null || user.emailVerifiedAt === undefined) {
    return null;
  }

  const handleResend = async () => {
    if (!user.email) return;
    setStatus('sending');
    try {
      await authService.resendVerification(user.email);
      setStatus('sent');
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
      <div className="flex items-center gap-2">
        <span aria-hidden>✉️</span>
        <span>
          Verificá tu email (<strong>{user.email}</strong>) para activar tu suscripción cuando la
          necesites.
        </span>
      </div>
      <div className="shrink-0">
        {status === 'sent' ? (
          <span className="font-medium text-emerald-700">¡Link reenviado! Revisá tu correo.</span>
        ) : (
          <button
            onClick={handleResend}
            disabled={status === 'sending'}
            className="font-semibold text-amber-900 underline hover:text-amber-700 disabled:opacity-50 disabled:no-underline"
          >
            {status === 'sending'
              ? 'Enviando…'
              : status === 'error'
                ? 'Reintentar envío'
                : 'Reenviar link'}
          </button>
        )}
      </div>
    </div>
  );
}
