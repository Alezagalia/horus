/**
 * ProfileModal - Hourly Rate & Profile Settings
 * F-04 · Precio en Horas de Vida
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/services/auth.service';
import { useSubscription } from '@/hooks/useSubscription';

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
}

export function ProfileModal({ open, onClose }: ProfileModalProps) {
  const { user, updateProfile, logout } = useAuthStore();
  const { data: subscription } = useSubscription();
  const [hourlyRateInput, setHourlyRateInput] = useState(
    user?.hourlyRate != null ? String(user.hourlyRate) : ''
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Data & privacy (S-02)
  const [exporting, setExporting] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await authService.exportData();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'horus-export.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Surface nothing intrusive; the button just re-enables.
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletePassword) {
      setDeleteError('Ingresá tu contraseña para confirmar.');
      return;
    }
    setDeleteError('');
    setDeleting(true);
    try {
      await authService.deleteAccount(deletePassword);
      // Account gone — clear the session and bounce to login.
      await logout();
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      setDeleteError(
        e.response?.data?.message || 'No se pudo eliminar la cuenta. Verificá tu contraseña.'
      );
      setDeleting(false);
    }
  };

  // Sync input when user changes
  useEffect(() => {
    setHourlyRateInput(user?.hourlyRate != null ? String(user.hourlyRate) : '');
  }, [user?.hourlyRate]);

  const handleSave = async () => {
    const value = parseFloat(hourlyRateInput);
    if (hourlyRateInput !== '' && (isNaN(value) || value <= 0)) {
      setError('Ingresa un número positivo o deja el campo vacío.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await updateProfile({ hourlyRate: hourlyRateInput === '' ? null : value });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError('No se pudo guardar. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl focus:outline-none">
          <Dialog.Title className="text-lg font-bold text-gray-900 mb-1">
            Configuración de perfil
          </Dialog.Title>
          <Dialog.Description className="text-sm text-gray-500 mb-6">
            Ajusta tu valor por hora para ver el costo en tiempo de vida de cada gasto.
          </Dialog.Description>

          {/* Hourly rate input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tu valor por hora (en tu moneda principal)
            </label>
            <p className="text-xs text-gray-400 mb-3">
              Se usa para mostrar cuántas horas de vida vale cada gasto
            </p>
            <input
              type="number"
              min="0"
              step="any"
              value={hourlyRateInput}
              onChange={(e) => {
                setHourlyRateInput(e.target.value);
                setSaved(false);
                setError('');
              }}
              placeholder="ej. 500"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
          </div>

          {/* Plan (S-03) */}
          <div className="mb-6 border-t border-gray-100 pt-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Tu plan</h3>
                <p className="text-xs text-gray-400">
                  Plan actual:{' '}
                  <span className="font-semibold text-indigo-600">
                    {subscription?.plan ?? 'FREE'}
                  </span>
                </p>
              </div>
              <Link
                to="/pricing"
                onClick={onClose}
                className="rounded-lg border border-indigo-200 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50"
              >
                Ver planes
              </Link>
            </div>
          </div>

          {/* Data & privacy (S-02) */}
          <div className="mb-6 border-t border-gray-100 pt-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Datos y privacidad</h3>
            <p className="text-xs text-gray-400 mb-3">
              Descargá una copia de tus datos o eliminá tu cuenta de forma permanente.
            </p>

            <button
              onClick={handleExport}
              disabled={exporting}
              className="w-full mb-3 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 transition-colors"
            >
              {exporting ? 'Generando…' : 'Descargar mis datos (JSON)'}
            </button>

            {!showDelete ? (
              <button
                onClick={() => setShowDelete(true)}
                className="w-full rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                Eliminar mi cuenta
              </button>
            ) : (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="text-xs text-red-800 mb-2">
                  Esta acción es <strong>permanente</strong> y borra todos tus datos. Ingresá tu
                  contraseña para confirmar.
                </p>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => {
                    setDeletePassword(e.target.value);
                    setDeleteError('');
                  }}
                  placeholder="Tu contraseña"
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-red-300 px-3 py-2 text-sm text-gray-900 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
                {deleteError && <p className="mt-1.5 text-xs text-red-700">{deleteError}</p>}
                <div className="mt-3 flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setShowDelete(false);
                      setDeletePassword('');
                      setDeleteError('');
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-60"
                  >
                    {deleting ? 'Eliminando…' : 'Eliminar definitivamente'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition-colors"
            >
              {saving ? 'Guardando...' : saved ? '✓ Guardado' : 'Guardar'}
            </button>
          </div>

          <Dialog.Close asChild>
            <button
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Cerrar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
