/**
 * ProfileModal - Hourly Rate & Profile Settings
 * F-04 · Precio en Horas de Vida
 */

import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useAuthStore } from '@/stores/authStore';

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
}

export function ProfileModal({ open, onClose }: ProfileModalProps) {
  const { user, updateProfile } = useAuthStore();
  const [hourlyRateInput, setHourlyRateInput] = useState(
    user?.hourlyRate != null ? String(user.hourlyRate) : ''
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

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
