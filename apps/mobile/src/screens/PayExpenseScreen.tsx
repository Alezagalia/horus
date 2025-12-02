/**
 * PayExpenseScreen
 * Sprint 10 - US-091, US-092
 *
 * Screen to mark a monthly expense as paid OR edit a paid expense
 * Supports two modes:
 * - create: Mark pending expense as paid
 * - edit: Edit already paid expense (with undo option)
 */

import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  payMonthlyExpense,
  updateMonthlyExpense,
  undoMonthlyExpensePayment,
  type MonthlyExpenseInstance,
} from '../api/monthlyExpenses.api';
import { getAccounts } from '../api/accounts.api';
import { AccountSelector } from '../components/transactions/AccountSelector';
import { TransactionDatePicker } from '../components/transactions/TransactionDatePicker';
import { Toast } from '../components/common/Toast';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type RootStackParamList = {
  MonthlyExpenses: undefined;
  PayMonthlyExpense: { expenseId: string; expense: MonthlyExpenseInstance };
};

type Props = NativeStackScreenProps<RootStackParamList, 'PayMonthlyExpense'>;

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

export function PayExpenseScreen({ navigation, route }: Props) {
  const { expense } = route.params;
  const queryClient = useQueryClient();

  // Determine mode: edit if expense is already paid, create otherwise
  const isEditMode = expense.status === 'pagado';

  // Form state - pre-populate if editing
  const [amount, setAmount] = useState(
    isEditMode
      ? expense.amount.toString()
      : expense.previousAmount
        ? expense.previousAmount.toString()
        : ''
  );
  const [accountId, setAccountId] = useState(expense.accountId || '');
  const [paidDate, setPaidDate] = useState(
    expense.paidDate ? new Date(expense.paidDate) : new Date()
  );
  const [notes, setNotes] = useState(expense.notes || '');

  // Validation errors
  const [errors, setErrors] = useState<{
    amount?: string;
    accountId?: string;
  }>({});

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Fetch accounts
  const { data: accountsData } = useQuery({
    queryKey: ['accounts'],
    queryFn: getAccounts,
  });

  const accounts = accountsData?.accounts || [];

  // Pay/Update mutation (depends on mode)
  const saveMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        amount: number;
        accountId: string;
        paidDate?: string;
        notes?: string;
      };
    }) => {
      if (isEditMode) {
        return updateMonthlyExpense(id, data);
      } else {
        return payMonthlyExpense(id, data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthlyExpenses'] });
      setToast({
        message: isEditMode
          ? 'Gasto actualizado correctamente'
          : 'Gasto pagado correctamente. Saldo actualizado.',
        type: 'success',
      });
      setTimeout(() => navigation.goBack(), 1500);
    },
    onError: (error: Error) => {
      const axiosError = error as { response?: { data?: { message?: string } } };
      setToast({
        message:
          axiosError.response?.data?.message ||
          (isEditMode ? 'Error al actualizar gasto' : 'Error al pagar gasto'),
        type: 'error',
      });
    },
  });

  // Undo payment mutation (only in edit mode)
  const undoMutation = useMutation({
    mutationFn: (id: string) => undoMonthlyExpensePayment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthlyExpenses'] });
      setToast({
        message: 'Pago deshecho. Saldo revertido.',
        type: 'success',
      });
      setTimeout(() => navigation.goBack(), 1500);
    },
    onError: (error: Error) => {
      const axiosError = error as { response?: { data?: { message?: string } } };
      setToast({
        message: axiosError.response?.data?.message || 'Error al deshacer pago',
        type: 'error',
      });
    },
  });

  // Check if selected account has sufficient balance
  const selectedAccount = accounts.find((acc) => acc.id === accountId);
  const amountNumber = parseFloat(amount);
  const hasSufficientBalance =
    !selectedAccount || isNaN(amountNumber) || selectedAccount.currentBalance >= amountNumber;

  // Validate form
  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    const amountNum = parseFloat(amount);
    if (!amount.trim() || isNaN(amountNum)) {
      newErrors.amount = 'El monto es requerido y debe ser un número válido';
    } else if (amountNum <= 0) {
      newErrors.amount = 'El monto debe ser mayor a 0';
    }

    if (!accountId) {
      newErrors.accountId = 'Debe seleccionar una cuenta';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = () => {
    if (!validate()) {
      return;
    }

    // Warning if insufficient balance
    if (!hasSufficientBalance && selectedAccount) {
      Alert.alert(
        'Saldo insuficiente',
        `La cuenta "${selectedAccount.name}" tiene un saldo de ${selectedAccount.currentBalance.toFixed(2)} ${selectedAccount.currency}, pero estás intentando pagar ${parseFloat(amount).toFixed(2)}. ¿Deseas continuar de todos modos?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Continuar',
            style: 'destructive',
            onPress: confirmPayment,
          },
        ]
      );
    } else {
      confirmPayment();
    }
  };

  const confirmPayment = () => {
    const data = {
      amount: parseFloat(amount),
      accountId,
      paidDate: paidDate.toISOString(),
      notes: notes.trim() || undefined,
    };

    saveMutation.mutate({ id: expense.id, data });
  };

  // Handle cancel
  const handleCancel = () => {
    if (amount || accountId || notes) {
      Alert.alert(
        'Descartar cambios',
        '¿Estás seguro que deseas salir? Los cambios no guardados se perderán.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Salir', style: 'destructive', onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  // Handle undo payment
  const handleUndoPayment = () => {
    Alert.alert(
      'Deshacer pago',
      '¿Seguro que deseas deshacer el pago? Esto revertirá el saldo de la cuenta.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Deshacer',
          style: 'destructive',
          onPress: () => undoMutation.mutate(expense.id),
        },
      ]
    );
  };

  const isLoading = saveMutation.isPending || undoMutation.isPending;

  const formatCurrency = (value: number, currency: string = 'ARS') => {
    const symbol = currency === 'USD' ? 'US$' : currency === 'EUR' ? '€' : '$';
    return `${symbol} ${value.toLocaleString('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Expense Info (Read-only) */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Información del Gasto</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Concepto:</Text>
            <Text style={styles.infoValue}>{expense.concept}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Categoría:</Text>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryIcon}>{expense.category?.icon || '💰'}</Text>
              <Text style={styles.categoryName}>{expense.category?.name || 'Sin categoría'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Mes:</Text>
            <Text style={styles.infoValue}>
              {MONTH_NAMES[expense.month - 1]} {expense.year}
            </Text>
          </View>

          {expense.previousAmount !== null && expense.previousAmount > 0 && (
            <View style={styles.referenceRow}>
              <Text style={styles.referenceLabel}>Mes anterior (referencia):</Text>
              <Text style={styles.referenceValue}>
                {formatCurrency(expense.previousAmount, expense.recurringExpense?.currency)}
              </Text>
            </View>
          )}
        </View>

        {/* Form */}
        <View style={styles.formSection}>
          <Text style={styles.formTitle}>Datos del Pago</Text>

          {/* Amount Input */}
          <View style={styles.field}>
            <Text style={styles.label}>Monto Pagado *</Text>
            <TextInput
              style={[styles.input, errors.amount && styles.inputError]}
              value={amount}
              onChangeText={(text) => {
                setAmount(text);
                if (errors.amount) {
                  setErrors({ ...errors, amount: undefined });
                }
              }}
              placeholder={expense.previousAmount ? expense.previousAmount.toString() : '0.00'}
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
              autoFocus
              editable={!isLoading}
            />
            {errors.amount && <Text style={styles.error}>{errors.amount}</Text>}
          </View>

          {/* Account Selector */}
          <AccountSelector
            accounts={accounts}
            value={accountId}
            onChange={(id) => {
              setAccountId(id);
              if (errors.accountId) {
                setErrors({ ...errors, accountId: undefined });
              }
            }}
            error={errors.accountId}
          />

          {/* Insufficient Balance Warning */}
          {!hasSufficientBalance && selectedAccount && !isNaN(amountNumber) && (
            <View style={styles.warningBox}>
              <Text style={styles.warningIcon}>⚠️</Text>
              <Text style={styles.warningText}>
                La cuenta seleccionada no tiene saldo suficiente. Saldo actual:{' '}
                {formatCurrency(selectedAccount.currentBalance, selectedAccount.currency)}
              </Text>
            </View>
          )}

          {/* Date Picker */}
          <TransactionDatePicker value={paidDate} onChange={setPaidDate} />

          {/* Notes */}
          <View style={styles.field}>
            <Text style={styles.label}>Notas (opcional)</Text>
            <TextInput
              style={[styles.textarea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Ej: Pagado por transferencia"
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
              maxLength={500}
              editable={!isLoading}
            />
            <Text style={styles.hint}>{notes.length}/500 caracteres</Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer with buttons */}
      <View style={styles.footer}>
        {/* Undo button (only in edit mode) */}
        {isEditMode && (
          <TouchableOpacity
            style={styles.undoButton}
            onPress={handleUndoPayment}
            disabled={isLoading}
          >
            <Text style={styles.undoButtonText}>Deshacer pago</Text>
          </TouchableOpacity>
        )}

        <View style={styles.footerActions}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel} disabled={isLoading}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitButtonText}>
                {isEditMode ? 'Guardar Cambios' : 'Confirmar Pago'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          visible={!!toast}
          onHide={() => setToast(null)}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  infoCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryIcon: {
    fontSize: 16,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
  },
  referenceRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  referenceLabel: {
    fontSize: 13,
    color: '#2196F3',
    fontWeight: '500',
  },
  referenceValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2196F3',
  },
  formSection: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 16,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    backgroundColor: '#FFF',
    color: '#333',
  },
  inputError: {
    borderColor: '#D32F2F',
  },
  textarea: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    backgroundColor: '#FFF',
    color: '#333',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  error: {
    fontSize: 12,
    color: '#D32F2F',
    marginTop: 4,
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    textAlign: 'right',
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  warningIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#E65100',
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'column',
    padding: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 12,
  },
  undoButton: {
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#F44336',
    alignItems: 'center',
    justifyContent: 'center',
  },
  undoButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#D32F2F',
  },
  footerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#90CAF9',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});
