/**
 * CreateTransactionScreen - Complete Implementation
 * Sprint 9 - US-081
 *
 * Screen for creating new transactions (ingreso/egreso)
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
import {
  createTransaction,
  type CreateTransactionInput,
  type TransactionType,
} from '../api/transactions.api';
import { getAccounts } from '../api/accounts.api';
import { TransactionTypeToggle } from '../components/transactions/TransactionTypeToggle';
import { AccountSelector } from '../components/transactions/AccountSelector';
import { TransactionCategorySelector } from '../components/transactions/TransactionCategorySelector';
import { TransactionDatePicker } from '../components/transactions/TransactionDatePicker';

interface CreateTransactionScreenProps {
  // TODO: Replace with route params when navigation is implemented
  accountId?: string; // Pre-select account if coming from AccountDetailScreen
}

export function CreateTransactionScreen({ accountId }: CreateTransactionScreenProps) {
  const queryClient = useQueryClient();

  // Form state
  const [type, setType] = useState<TransactionType>('egreso');
  const [selectedAccountId, setSelectedAccountId] = useState(accountId || '');
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [concept, setConcept] = useState('');
  const [date, setDate] = useState(new Date());
  const [notes, setNotes] = useState('');

  // Validation errors
  const [errors, setErrors] = useState<{
    account?: string;
    category?: string;
    amount?: string;
    concept?: string;
  }>({});

  // Fetch accounts
  const { data: accountsData } = useQuery({
    queryKey: ['accounts'],
    queryFn: getAccounts,
  });

  const accounts = accountsData?.accounts || [];

  // Create transaction mutation
  const createMutation = useMutation({
    mutationFn: createTransaction,
    onSuccess: (newTransaction) => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['financeStats'] });

      // Find updated account balance
      const account = accounts.find((a) => a.id === selectedAccountId);
      const newBalance = account
        ? calculateNewBalance(account.currentBalance, type, Number(amount))
        : 0;

      // TODO: Show success toast with new balance
      console.log(`✅ ${type === 'ingreso' ? 'Ingreso' : 'Egreso'} registrado!`);
      console.log(`Nuevo saldo: ${newBalance}`);

      // TODO: Navigate back to AccountDetailScreen or previous screen
      console.log('Navigate back with transaction:', newTransaction.id);
    },
    onError: (error: Error) => {
      const axiosError = error as { response?: { data?: { message?: string } } };
      console.error(
        'Error creating transaction:',
        axiosError.response?.data?.message || error.message
      );
      // TODO: Show error toast
    },
  });

  // Calculate new balance for success message
  const calculateNewBalance = (
    currentBalance: number,
    txType: TransactionType,
    txAmount: number
  ): number => {
    return txType === 'ingreso' ? currentBalance + txAmount : currentBalance - txAmount;
  };

  // Validate form
  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!selectedAccountId) {
      newErrors.account = 'Debes seleccionar una cuenta';
    }

    if (!categoryId) {
      newErrors.category = 'Debes seleccionar una categoría';
    }

    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum)) {
      newErrors.amount = 'Debes ingresar un monto válido';
    } else if (amountNum <= 0) {
      newErrors.amount = 'El monto debe ser mayor a 0';
    }

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

    const transactionData: CreateTransactionInput = {
      accountId: selectedAccountId,
      categoryId,
      type,
      amount: parseFloat(amount),
      concept: concept.trim(),
      date: date.toISOString(),
      notes: notes.trim() || undefined,
    };

    createMutation.mutate(transactionData);
  };

  const isLoading = createMutation.isPending;
  const buttonColor = type === 'ingreso' ? '#10B981' : '#EF4444';
  const buttonText = type === 'ingreso' ? 'Registrar Ingreso' : 'Registrar Egreso';

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
        {/* Type Toggle */}
        <TransactionTypeToggle value={type} onChange={setType} />

        {/* Account Selector */}
        <AccountSelector
          accounts={accounts}
          value={selectedAccountId}
          onChange={(id) => {
            setSelectedAccountId(id);
            if (errors.account) {
              setErrors({ ...errors, account: undefined });
            }
          }}
          error={errors.account}
        />

        {/* Category Selector */}
        <TransactionCategorySelector
          value={categoryId}
          onChange={(id) => {
            setCategoryId(id);
            if (errors.category) {
              setErrors({ ...errors, category: undefined });
            }
          }}
          error={errors.category}
        />

        {/* Amount Input */}
        <View style={styles.field}>
          <Text style={styles.label}>Monto *</Text>
          <TextInput
            style={[styles.input, styles.amountInput, errors.amount && styles.inputError]}
            value={amount}
            onChangeText={(text) => {
              // Only allow numbers and decimal point
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
            placeholder="Ej: Compra en supermercado"
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
          style={[
            styles.submitButton,
            { backgroundColor: buttonColor },
            isLoading && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>{buttonText}</Text>
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
