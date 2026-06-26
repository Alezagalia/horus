/**
 * Pricing Page (S-04.2, frontend-first)
 *
 * Shows the Free vs Pro comparison and the user's current plan. The upgrade
 * CTA is intentionally a "coming soon" placeholder until Stripe checkout (S-04)
 * is wired up.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useSubscription } from '@/hooks/useSubscription';
import { subscriptionApi } from '@/services/subscriptionApi';

const FREE_FEATURES = [
  'Hasta 5 hábitos',
  '1 meta activa',
  '1 cuenta financiera',
  'Tareas y calendario propio',
  'Revisión semanal básica',
];

const PRO_FEATURES = [
  'Hábitos, metas y cuentas ilimitadas',
  'Sincronización con Google Calendar',
  'Módulo de fitness y nutrición',
  'Estadísticas e insights avanzados',
  'Histórico completo de datos',
];

export function PricingPage() {
  const { data, isLoading } = useSubscription();
  const plan = data?.plan ?? 'FREE';
  const [loadingInterval, setLoadingInterval] = useState<'monthly' | 'annual' | null>(null);

  const startCheckout = async (interval: 'monthly' | 'annual') => {
    setLoadingInterval(interval);
    try {
      const { url } = await subscriptionApi.createCheckout(interval);
      window.location.href = url; // Lemon Squeezy hosted checkout
    } catch (err) {
      const e = err as { response?: { status?: number; data?: { message?: string } } };
      // 402 is already toasted by the axios interceptor.
      if (e.response?.status !== 402) {
        toast.error(e.response?.data?.message || 'La suscripción todavía no está disponible.');
      }
      setLoadingInterval(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Planes</h1>
        <p className="mt-2 text-gray-500">
          Elegí el plan que mejor acompañe tu productividad.
          {!isLoading && (
            <>
              {' '}
              Tu plan actual: <span className="font-semibold text-indigo-600">{plan}</span>.
            </>
          )}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Free */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Free</h2>
            {plan === 'FREE' && (
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                Tu plan
              </span>
            )}
          </div>
          <p className="mt-1 text-3xl font-extrabold text-gray-900">$0</p>
          <ul className="mt-5 space-y-2 text-sm text-gray-600">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex gap-2">
                <span className="text-emerald-500">✓</span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Pro */}
        <div className="rounded-2xl border-2 border-indigo-500 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-indigo-700">Pro</h2>
            {plan === 'PRO' && (
              <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                Tu plan
              </span>
            )}
          </div>
          <p className="mt-1 text-3xl font-extrabold text-gray-900">
            $5<span className="text-base font-medium text-gray-400"> /mes</span>
          </p>
          <ul className="mt-5 space-y-2 text-sm text-gray-600">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex gap-2">
                <span className="text-indigo-500">✓</span>
                {f}
              </li>
            ))}
          </ul>

          {plan === 'PRO' ? (
            <div className="mt-6 rounded-lg bg-emerald-50 px-4 py-2 text-center text-sm font-medium text-emerald-700">
              Ya tenés Pro 🎉
            </div>
          ) : (
            <div className="mt-6 space-y-2">
              <button
                onClick={() => startCheckout('monthly')}
                disabled={loadingInterval !== null}
                className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {loadingInterval === 'monthly' ? 'Redirigiendo…' : 'Suscribirme mensual'}
              </button>
              <button
                onClick={() => startCheckout('annual')}
                disabled={loadingInterval !== null}
                className="w-full rounded-lg border border-indigo-300 px-4 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 disabled:opacity-60"
              >
                {loadingInterval === 'annual' ? 'Redirigiendo…' : 'Suscribirme anual'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 text-center">
        <Link to="/" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
          ← Volver al inicio
        </Link>
      </div>
    </div>
  );
}
