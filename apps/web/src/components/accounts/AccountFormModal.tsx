/**
 * Account Form Modal Component (Create/Edit)
 * Sprint 13 - US-119
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Account, AccountType, Currency } from '@horus/shared';
import { ACCOUNT_TYPE_LABELS, ACCOUNT_TYPE_ICONS, ACCOUNT_TYPE_COLORS } from '@horus/shared';

const CURRENCIES: Currency[] = ['ARS', 'USD', 'EUR', 'BRL'];

const formSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(100, 'Máximo 100 caracteres'),
  type: z.enum(['efectivo', 'banco', 'billetera_digital', 'tarjeta'] as const),
  currency: z.enum([
    'ARS',
    'USD',
    'EUR',
    'BRL',
    'CLP',
    'COP',
    'MXN',
    'UYU',
    'PEN',
    'GBP',
    'JPY',
    'CNY',
    'CHF',
    'CAD',
    'AUD',
    'NZD',
    'INR',
    'RUB',
  ] as const),
  initialBalance: z.number().min(0, 'Debe ser mayor o igual a 0'),
  color: z.string().optional(),
  icon: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface AccountFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => void;
  editingAccount?: Account | null;
}

export function AccountFormModal({
  isOpen,
  onClose,
  onSubmit,
  editingAccount,
}: AccountFormModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      type: 'efectivo',
      currency: 'ARS',
      initialBalance: 0,
      color: ACCOUNT_TYPE_COLORS.efectivo,
      icon: ACCOUNT_TYPE_ICONS.efectivo,
    },
  });

  const selectedType = watch('type');

  useEffect(() => {
    if (editingAccount) {
      reset({
        name: editingAccount.name,
        type: editingAccount.type,
        currency: editingAccount.currency as Currency,
        initialBalance: editingAccount.initialBalance,
        color: editingAccount.color,
        icon: editingAccount.icon,
      });
    } else {
      reset({
        name: '',
        type: 'efectivo',
        currency: 'ARS',
        initialBalance: 0,
        color: ACCOUNT_TYPE_COLORS.efectivo,
        icon: ACCOUNT_TYPE_ICONS.efectivo,
      });
    }
  }, [editingAccount, reset]);

  // Auto-set default color and icon when type changes (only for new accounts)
  useEffect(() => {
    if (!editingAccount && selectedType) {
      setValue('color', ACCOUNT_TYPE_COLORS[selectedType]);
      setValue('icon', ACCOUNT_TYPE_ICONS[selectedType]);
    }
  }, [selectedType, editingAccount, setValue]);

  if (!isOpen) return null;

  const isEditing = !!editingAccount;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-lg">
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditing ? 'Editar Cuenta' : 'Nueva Cuenta'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre *
              </label>
              <input
                id="name"
                {...register('name')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Mi cuenta"
                maxLength={100}
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo *</label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(ACCOUNT_TYPE_LABELS) as AccountType[]).map((type) => (
                  <label
                    key={type}
                    className={`flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                      watch('type') === type
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    } ${isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <input
                      type="radio"
                      value={type}
                      {...register('type')}
                      disabled={isEditing}
                      className="text-indigo-600"
                    />
                    <span className="text-xl">{ACCOUNT_TYPE_ICONS[type]}</span>
                    <span className="text-sm font-medium">{ACCOUNT_TYPE_LABELS[type]}</span>
                  </label>
                ))}
              </div>
              {isEditing && (
                <p className="mt-1 text-xs text-gray-500">El tipo no puede modificarse</p>
              )}
            </div>

            {/* Currency */}
            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
                Moneda *
              </label>
              <select
                id="currency"
                {...register('currency')}
                disabled={isEditing}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  isEditing ? 'bg-gray-50 cursor-not-allowed' : ''
                }`}
              >
                {CURRENCIES.map((curr) => (
                  <option key={curr} value={curr}>
                    {curr}
                  </option>
                ))}
              </select>
              {isEditing && (
                <p className="mt-1 text-xs text-gray-500">La moneda no puede modificarse</p>
              )}
            </div>

            {/* Initial Balance */}
            <div>
              <label
                htmlFor="initialBalance"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Saldo Inicial *
              </label>
              <input
                id="initialBalance"
                type="number"
                step="0.01"
                {...register('initialBalance', { valueAsNumber: true })}
                disabled={isEditing}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  isEditing ? 'bg-gray-50 cursor-not-allowed' : ''
                }`}
                placeholder="0.00"
              />
              {errors.initialBalance && (
                <p className="mt-1 text-sm text-red-600">{errors.initialBalance.message}</p>
              )}
              {isEditing && (
                <p className="mt-1 text-xs text-gray-500">El saldo inicial no puede modificarse</p>
              )}
            </div>

            {/* Color (optional) */}
            <div>
              <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">
                Color (opcional)
              </label>
              <input
                id="color"
                type="color"
                {...register('color')}
                className="w-full h-10 px-1 py-1 border border-gray-300 rounded-lg cursor-pointer"
              />
            </div>

            {/* Icon (optional) */}
            <div>
              <label htmlFor="icon" className="block text-sm font-medium text-gray-700 mb-1">
                Icono (opcional)
              </label>
              <input
                id="icon"
                {...register('icon')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="💰"
                maxLength={10}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
              >
                {isEditing ? 'Guardar Cambios' : 'Crear Cuenta'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
