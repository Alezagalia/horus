/**
 * TransferScreen - Complete Implementation
 * Sprint 9 - US-082
 *
 * Screen for transferring money between user's accounts
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
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createTransfer, type CreateTransferInput } from '../api/transactions.api';
import { getAccounts } from '../api/accounts.api';
import { AccountSelector } from '../components/transactions/AccountSelector';
import { TransactionDatePicker } from '../components/transactions/TransactionDatePicker';
import { TransferArrowIndicator } from '../components/transfers/TransferArrowIndicator';
import { AvailableBalanceDisplay } from '../components/transfers/AvailableBalanceDisplay';
import { formatCurrency } from '../utils/currency';

export function TransferScreen() {
  const queryClient = useQueryClient();

  // Form state
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [concept, setConcept] = useState('Transferencia');
  const [date, setDate] = useState(new Date());
  const [notes, setNotes] = useState('');

  // Validation errors
  const [errors, setErrors] = useState<{
    fromAccount?: string;
    toAccount?: string;
    amount?: string;
    concept?: string;
  }>({});

  // Fetch accounts
  const { data: accountsData } = useQuery({
    queryKey: ['accounts'],
    queryFn: getAccounts,
  });

  const accounts = accountsData?.accounts || [];

  // Get selected accounts
  const fromAccount = accounts.find((acc) => acc.id === fromAccountId);
  const toAccount = accounts.find((acc) => acc.id === toAccountId);

  // Filter accounts for selectors
  const activeAccountsWithBalance = accounts.filter(
    (acc) => acc.isActive && acc.currentBalance > 0
  );
  const availableDestinationAccounts = accounts.filter(
    (acc) => acc.isActive && acc.id !== fromAccountId
  );

  // Create transfer mutation
  const transferMutation = useMutation({
    mutationFn: createTransfer,
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['financeStats'] });

      // Calculate new balances
      const newFromBalance = fromAccount!.currentBalance - Number(amount);
      const newToBalance = toAccount!.currentBalance + Number(amount);

      // TODO: Show success toast with both new balances
      console.log('✅ Transferencia exitosa!');
      console.log(`${fromAccount!.name}: ${formatCurrency(newFromBalance, fromAccount!.currency)}`);
      console.log(`${toAccount!.name}: ${formatCurrency(newToBalance, toAccount!.currency)}`);

      // TODO: Navigate back to AccountsScreen
      console.log('Navigate back to AccountsScreen');
    },
    onError: (error: Error) => {
      const axiosError = error as { response?: { data?: { message?: string } } };
      console.error(
        'Error creating transfer:',
        axiosError.response?.data?.message || error.message
      );
      // TODO: Show error toast
    },
  });

  // Validate form
  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!fromAccountId) {
      newErrors.fromAccount = 'Debes seleccionar la cuenta origen';
    }

    if (!toAccountId) {
      newErrors.toAccount = 'Debes seleccionar la cuenta destino';
    }

    // Validate accounts are different
    if (fromAccountId && toAccountId && fromAccountId === toAccountId) {
      newErrors.toAccount = 'La cuenta destino debe ser diferente a la origen';
    }

    // Validate same currency
    if (fromAccount && toAccount && fromAccount.currency !== toAccount.currency) {
      newErrors.toAccount = `Las cuentas deben tener la misma moneda (${fromAccount.currency})`;
    }

    // Validate amount
    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum)) {
      newErrors.amount = 'Debes ingresar un monto válido';
    } else if (amountNum <= 0) {
      newErrors.amount = 'El monto debe ser mayor a 0';
    } else if (fromAccount && amountNum > fromAccount.currentBalance) {
      newErrors.amount = `El monto no puede exceder el saldo disponible (${formatCurrency(fromAccount.currentBalance, fromAccount.currency)})`;
    }

    // Validate concept
    if (!concept.trim()) {
      newErrors.concept = 'El concepto es requerido';
    } else if (concept.length > 200) {
      newErrors.concept = 'El concepto no puede exceder 200 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = () => {
    if (!validate()) {
      return;
    }

    const transferData: CreateTransferInput = {
      fromAccountId,
      toAccountId,
      amount: parseFloat(amount),
      concept: concept.trim(),
      date: date.toISOString(),
      notes: notes.trim() || undefined,
    };

    transferMutation.mutate(transferData);
  };

  // Auto-clear toAccount if same currency validation fails
  const handleFromAccountChange = (accountId: string) => {
    setFromAccountId(accountId);
    if (errors.fromAccount) {
      setErrors({ ...errors, fromAccount: undefined });
    }

    // Clear toAccount if it becomes invalid (same currency)
    if (toAccountId) {
      const newFromAcc = accounts.find((a) => a.id === accountId);
      const currentToAcc = accounts.find((a) => a.id === toAccountId);
      if (newFromAcc && currentToAcc && newFromAcc.currency !== currentToAcc.currency) {
        setToAccountId('');
        setErrors({ ...errors, toAccount: undefined });
      }
    }
  };

  const isLoading = transferMutation.isPending;
  const amountNum = parseFloat(amount);
  const isInsufficientBalance =
    fromAccount && !isNaN(amountNum) && amountNum > fromAccount.currentBalance;

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
        {/* From Account Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Desde</Text>
          <AccountSelector
            accounts={activeAccountsWithBalance}
            value={fromAccountId}
            onChange={handleFromAccountChange}
            error={errors.fromAccount}
          />
        </View>

        {/* Transfer Arrow Indicator */}
        <TransferArrowIndicator />

        {/* To Account Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Hacia</Text>
          <AccountSelector
            accounts={availableDestinationAccounts}
            value={toAccountId}
            onChange={(id) => {
              setToAccountId(id);
              if (errors.toAccount) {
                setErrors({ ...errors, toAccount: undefined });
              }
            }}
            error={errors.toAccount}
          />
        </View>

        {/* Amount Input */}
        <View style={styles.field}>
          <Text style={styles.label}>Monto *</Text>
          <TextInput
            style={[styles.input, styles.amountInput, errors.amount && styles.inputError]}
            value={amount}
            onChangeText={(text) => {
              const formatted = text.replace(/[^0-9.]/g, '');
              setAmount(formatted);
              if (errors.amount) {
                setErrors({ ...errors, amount: undefined });
              }
            }}
            placeholder="0.00"
            keyboardType="decimal-pad"
            editable={!isLoading}
          />
          {errors.amount && <Text style={styles.error}>{errors.amount}</Text>}

          {/* Available Balance Display */}
          {fromAccount && (
            <AvailableBalanceDisplay
              balance={fromAccount.currentBalance}
              currency={fromAccount.currency}
              isInsufficient={isInsufficientBalance}
            />
          )}
        </View>

        {/* Concept Input */}
        <View style={styles.field}>
          <Text style={styles.label}>Concepto *</Text>
          <TextInput
            style={[styles.input, errors.concept && styles.inputError]}
            value={concept}
            onChangeText={(text) => {
              setConcept(text);
              if (errors.concept) {
                setErrors({ ...errors, concept: undefined });
              }
            }}
            placeholder="Ej: Transferencia entre cuentas"
            maxLength={200}
            editable={!isLoading}
          />
          <Text style={styles.charCount}>{concept.length}/200</Text>
          {errors.concept && <Text style={styles.error}>{errors.concept}</Text>}
        </View>

        {/* Date Picker */}
        <TransactionDatePicker value={date} onChange={setDate} />

        {/* Notes Input (Optional) */}
        <View style={styles.field}>
          <Text style={styles.label}>Notas (Opcional)</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Agrega notas adicionales..."
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            editable={!isLoading}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Transferir</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#111827',
  },
  amountInput: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  notesInput: {
    minHeight: 100,
    paddingTop: 14,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  error: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  charCount: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
