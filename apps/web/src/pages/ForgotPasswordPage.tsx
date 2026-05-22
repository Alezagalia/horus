/**
 * Forgot Password Page
 *
 * Requests a password-reset email. Always shows the same confirmation,
 * regardless of whether the email is registered (no enumeration).
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { authService } from '@/services/auth.service';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/lib/validations/auth';

export function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setError(null);
      await authService.forgotPassword(data.email);
      setSubmitted(true);
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'No pudimos procesar la solicitud. Probá de nuevo.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Restablecer contraseña
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Ingresá tu email y te enviaremos un link para elegir una nueva contraseña.
          </p>
        </div>

        {submitted ? (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-6 text-center">
            <div className="text-4xl mb-3">✉️</div>
            <h3 className="text-base font-semibold text-emerald-900 mb-1">Revisá tu casilla</h3>
            <p className="text-sm text-emerald-700">
              Si el email está registrado, te llegará un link en los próximos minutos. El link
              expira en 1 hora.
            </p>
            <div className="mt-6">
              <Link
                to="/login"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                ← Volver al login
              </Link>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="tu@email.com"
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Enviando…' : 'Enviar link de recuperación'}
            </button>

            <div className="text-center">
              <Link to="/login" className="text-sm text-indigo-600 hover:text-indigo-500">
                ← Volver al login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
