/**
 * Transfer Modal Component
 * Sprint 13 - US-121
 */

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAccounts } from '@/hooks/useAccounts';
import { useCreateTransfer } from '@/hooks/useTransactions';
import { formatCurrency } from '@/utils/currency';

const formSchema = z.object({
  fromAccountId: z.string().min(1, 'Cuenta origen requerida'),
  toAccountId: z.string().min(1, 'Cuenta destino requerida'),
  amount: z.number().min(0.01, 'El monto debe ser mayor a 0'),
  concept: z.string().min(1, 'Concepto requerido').max(200, 'Máximo 200 caracteres'),
  date: z.string().min(1, 'Fecha requerida'),
  notes: z.string().max(1000, 'Máximo 1000 caracteres').optional(),
});

type FormData = z.infer<typeof formSchema>;

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultFromAccountId?: string;
}

export function TransferModal({ isOpen, onClose, defaultFromAccountId }: TransferModalProps) {
  const { data: accounts = [] } = useAccounts();
  const createTransferMutation = useCreateTransfer();

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
      fromAccountId: defaultFromAccountId || '',
      toAccountId: '',
      amount: 0,
      concept: 'Transferencia',
      date: new Date().toISOString().split('T')[0],
      notes: '',
    },
  });

  const selectedFromAccountId = watch('fromAccountId');
  const selectedToAccountId = watch('toAccountId');
  const amount = watch('amount');

  // Ensure accounts is an array before filtering
  const accountsList = Array.isArray(accounts) ? accounts : [];
  const activeAccounts = accountsList.filter((acc) => acc.isActive);

  // Get selected accounts
  const fromAccount = activeAccounts.find((acc) => acc.id === selectedFromAccountId);
  const toAccount = activeAccounts.find((acc) => acc.id === selectedToAccountId);

  // Filter destination accounts (same currency, different from origin)
  const availableToAccounts = activeAccounts.filter(
    (acc) => acc.id !== selectedFromAccountId && acc.currency === fromAccount?.currency
  );

  // Validation states
  const [validationErrors, setValidationErrors] = useState<{
    sameCurrency?: string;
    sameAccount?: string;
    insufficientFunds?: string;
  }>({});

  useEffect(() => {
    const errors: typeof validationErrors = {};

    if (selectedFromAccountId && selectedToAccountId) {
      if (selectedFromAccountId === selectedToAccountId) {
        errors.sameAccount = 'No puedes transferir a la misma cuenta';
      }

      if (fromAccount && toAccount && fromAccount.currency !== toAccount.currency) {
        errors.sameCurrency = 'Las cuentas deben tener la misma moneda';
      }
    }

    if (fromAccount && amount > 0 && amount > fromAccount.currentBalance) {
      errors.insufficientFunds = 'Saldo insuficiente';
    }

    setValidationErrors(errors);
  }, [selectedFromAccountId, selectedToAccountId, fromAccount, toAccount, amount]);

  useEffect(() => {
    if (defaultFromAccountId) {
      setValue('fromAccountId', defaultFromAccountId);
    }
  }, [defaultFromAccountId, setValue]);

  useEffect(() => {
    reset({
      fromAccountId: defaultFromAccountId || '',
      toAccountId: '',
      amount: 0,
      concept: 'Transferencia',
      date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setValidationErrors({});
  }, [isOpen, defaultFromAccountId, reset]);

  const onSubmit = (data: FormData) => {
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    createTransferMutation.mutate(
      {
        fromAccountId: data.fromAccountId,
        toAccountId: data.toAccountId,
        amount: data.amount,
        concept: data.concept,
        date: new Date(data.date).toISOString(),
        notes: data.notes || undefined,
      },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  if (!isOpen) return null;

  const hasValidationErrors = Object.keys(validationErrors).length > 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-lg">
            <h2 className="text-xl font-semibold text-gray-900">Transferir entre Cuentas</h2>
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
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            {/* Two Cards Layout with Arrow */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center">
              {/* From Account Card */}
              <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border-2 border-red-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">Desde</label>
                <select
                  {...register('fromAccountId')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                >
                  <option value="">Seleccionar cuenta origen</option>
                  {activeAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.icon} {acc.name} ({acc.currency})
                    </option>
                  ))}
                </select>
                {errors.fromAccountId && (
                  <p className="mt-1 text-sm text-red-600">{errors.fromAccountId.message}</p>
                )}

                {fromAccount && (
                  <div className="mt-3 p-3 bg-white rounded border border-red-200">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{fromAccount.icon}</span>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{fromAccount.name}</p>
                        <p className="text-xs text-gray-500">{fromAccount.type}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Saldo actual</p>
                      <p className="text-lg font-bold text-gray-900">
                        {formatCurrency(fromAccount.currentBalance, fromAccount.currency)}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Arrow */}
              <div className="hidden md:flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </div>

              {/* To Account Card */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border-2 border-green-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">Hacia</label>
                <select
                  {...register('toAccountId')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                  disabled={!fromAccount}
                >
                  <option value="">Seleccionar cuenta destino</option>
                  {availableToAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.icon} {acc.name} ({acc.currency})
                    </option>
                  ))}
                </select>
                {errors.toAccountId && (
                  <p className="mt-1 text-sm text-red-600">{errors.toAccountId.message}</p>
                )}

                {toAccount && (
                  <div className="mt-3 p-3 bg-white rounded border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{toAccount.icon}</span>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{toAccount.name}</p>
                        <p className="text-xs text-gray-500">{toAccount.type}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Saldo actual</p>
                      <p className="text-lg font-bold text-gray-900">
                        {formatCurrency(toAccount.currentBalance, toAccount.currency)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Validation Errors */}
            {hasValidationErrors && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <svg
                    className="w-5 h-5 text-red-600 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div className="flex-1">
                    <p className="font-medium text-red-800 mb-1">Errores de validación:</p>
                    <ul className="list-disc list-inside text-sm text-red-700">
                      {validationErrors.sameAccount && <li>{validationErrors.sameAccount}</li>}
                      {validationErrors.sameCurrency && <li>{validationErrors.sameCurrency}</li>}
                      {validationErrors.insufficientFunds && (
                        <li>{validationErrors.insufficientFunds}</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Amount */}
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                Monto *
              </label>
              <input
                id="amount"
                type="number"
                step="0.01"
                {...register('amount', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="0.00"
              />
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
              )}
              {fromAccount && (
                <p className="mt-1 text-sm text-gray-600">
                  Saldo disponible:{' '}
                  {formatCurrency(fromAccount.currentBalance, fromAccount.currency)}
                </p>
              )}
            </div>

            {/* Concept */}
            <div>
              <label htmlFor="concept" className="block text-sm font-medium text-gray-700 mb-1">
                Concepto *
              </label>
              <input
                id="concept"
                {...register('concept')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Transferencia"
                maxLength={200}
              />
              {errors.concept && (
                <p className="mt-1 text-sm text-red-600">{errors.concept.message}</p>
              )}
            </div>

            {/* Date */}
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                Fecha *
              </label>
              <input
                id="date"
                type="date"
                {...register('date')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>}
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notas (opcional)
              </label>
              <textarea
                id="notes"
                {...register('notes')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Notas adicionales..."
                maxLength={1000}
              />
              {errors.notes && <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>}
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
                disabled={hasValidationErrors || createTransferMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {createTransferMutation.isPending && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                Transferir
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
