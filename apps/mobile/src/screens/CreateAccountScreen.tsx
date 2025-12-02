/**
 * CreateAccountScreen - Complete Implementation
 * Sprint 9 - US-079
 *
 * Screen for creating new accounts
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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createAccount, type CreateAccountInput } from '../api/accounts.api';
import {
  AccountTypePicker,
  type AccountType,
  ACCOUNT_TYPES,
} from '../components/accounts/AccountTypePicker';
import { CurrencyPicker } from '../components/accounts/CurrencyPicker';
import { ColorPicker } from '../components/accounts/ColorPicker';
import { IconPicker } from '../components/accounts/IconPicker';

export function CreateAccountScreen() {
  const queryClient = useQueryClient();

  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('efectivo');
  const [currency, setCurrency] = useState('ARS');
  const [initialBalance, setInitialBalance] = useState('0');
  const [color, setColor] = useState('#10B981'); // Default: efectivo green
  const [icon, setIcon] = useState('wallet'); // Default icon

  // Validation errors
  const [errors, setErrors] = useState<{
    name?: string;
    initialBalance?: string;
  }>({});

  // Create account mutation
  const createMutation = useMutation({
    mutationFn: createAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      // TODO: Show success toast
      // TODO: Navigate back to AccountsScreen
      console.log('Account created successfully!');
    },
    onError: (error: Error) => {
      const axiosError = error as { response?: { data?: { message?: string } } };
      console.error('Error creating account:', axiosError.response?.data?.message || error.message);
      // TODO: Show error toast
    },
  });

  // Update defaults when type changes
  const handleTypeChange = (newType: AccountType) => {
    setType(newType);

    // Update color and icon defaults based on type
    const typeConfig = ACCOUNT_TYPES.find((t) => t.type === newType);
    if (typeConfig) {
      setColor(typeConfig.color);
      // Set icon based on type
      switch (newType) {
        case 'efectivo':
          setIcon('cash');
          break;
        case 'banco':
          setIcon('business');
          break;
        case 'billetera_digital':
          setIcon('card');
          break;
        case 'tarjeta':
          setIcon('card');
          break;
      }
    }
  };

  // Validate form
  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!name.trim()) {
      newErrors.name = 'El nombre es requerido';
    } else if (name.length > 100) {
      newErrors.name = 'El nombre no puede exceder 100 caracteres';
    }

    const balance = parseFloat(initialBalance);
    if (isNaN(balance)) {
      newErrors.initialBalance = 'Debe ser un número válido';
    } else if (balance < 0) {
      newErrors.initialBalance = 'El saldo no puede ser negativo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = () => {
    if (!validate()) {
      return;
    }

    const accountData: CreateAccountInput = {
      name: name.trim(),
      type,
      currency,
      initialBalance: parseFloat(initialBalance),
      color,
      icon,
    };

    createMutation.mutate(accountData);
  };

  const isLoading = createMutation.isPending;

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
        {/* Name Input */}
        <View style={styles.field}>
          <Text style={styles.label}>Nombre *</Text>
          <TextInput
            style={[styles.input, errors.name && styles.inputError]}
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (errors.name) {
                setErrors({ ...errors, name: undefined });
              }
            }}
            placeholder="Ej: Billetera Principal"
            maxLength={100}
            editable={!isLoading}
          />
          {errors.name && <Text style={styles.error}>{errors.name}</Text>}
        </View>

        {/* Account Type Picker */}
        <AccountTypePicker value={type} onChange={handleTypeChange} />

        {/* Currency Picker */}
        <CurrencyPicker value={currency} onChange={setCurrency} />

        {/* Initial Balance Input */}
        <View style={styles.field}>
          <Text style={styles.label}>Saldo Inicial *</Text>
          <TextInput
            style={[styles.input, errors.initialBalance && styles.inputError]}
            value={initialBalance}
            onChangeText={(text) => {
              setInitialBalance(text);
              if (errors.initialBalance) {
                setErrors({ ...errors, initialBalance: undefined });
              }
            }}
            placeholder="0.00"
            keyboardType="decimal-pad"
            editable={!isLoading}
          />
          {errors.initialBalance && <Text style={styles.error}>{errors.initialBalance}</Text>}
        </View>

        {/* Color Picker */}
        <ColorPicker value={color} onChange={setColor} />

        {/* Icon Picker */}
        <IconPicker value={icon} onChange={setIcon} />

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
            <Text style={styles.submitButtonText}>Crear Cuenta</Text>
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
  inputError: {
    borderColor: '#EF4444',
  },
  error: {
    fontSize: 12,
    color: '#EF4444',
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
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
