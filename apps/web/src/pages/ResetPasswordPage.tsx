/**
 * Reset Password Page
 *
 * Consumes the token from the URL (?token=...) and lets the user set a new
 * password. On success redirects to /login.
 */

import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { authService } from '@/services/auth.service';
import { resetPasswordSchema, type ResetPasswordFormData } from '@/lib/validations/auth';

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      setError(null);
      await authService.resetPassword(token, data.password);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'No pudimos cambiar tu contraseña. Probá de nuevo.');
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full rounded-xl bg-amber-50 border border-amber-200 p-6 text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <h3 className="text-base font-semibold text-amber-900 mb-1">Link inválido</h3>
          <p className="text-sm text-amber-700 mb-4">
            Este link no incluye un token de reset. Pedí uno nuevo desde el login.
          </p>
          <Link
            to="/forgot-password"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            Pedir nuevo link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Elegir nueva contraseña
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Ingresá una contraseña nueva para tu cuenta.
          </p>
        </div>

        {success ? (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-6 text-center">
            <div className="text-4xl mb-3">✅</div>
            <h3 className="text-base font-semibold text-emerald-900 mb-1">
              Contraseña actualizada
            </h3>
            <p className="text-sm text-emerald-700">Te estamos redirigiendo al login…</p>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-800">{error}</p>
                <div className="mt-2">
                  <Link
                    to="/forgot-password"
                    className="text-sm font-medium text-red-700 underline hover:text-red-800"
                  >
                    Pedir un nuevo link
                  </Link>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label htmlFor="password" className="sr-only">
                  Nueva contraseña
                </label>
                <input
                  {...register('password')}
                  type="password"
                  autoComplete="new-password"
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Nueva contraseña (mín. 8 caracteres)"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="sr-only">
                  Confirmar contraseña
                </label>
                <input
                  {...register('confirmPassword')}
                  type="password"
                  autoComplete="new-password"
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Repetir contraseña"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Guardando…' : 'Guardar contraseña'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
