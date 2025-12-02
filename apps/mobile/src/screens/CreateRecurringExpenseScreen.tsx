/**
 * CreateRecurringExpenseScreen
 * Sprint 10 - US-089
 *
 * Screen for creating or editing recurring expense templates
 * Reusable for both create and edit modes
 */

import { useState, useEffect } from 'react';
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
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import {
  createRecurringExpense,
  updateRecurringExpense,
  getRecurringExpenseById,
  type CreateRecurringExpenseInput,
  type UpdateRecurringExpenseInput,
} from '../api/recurringExpenses.api';
import { CurrencySelector, type Currency } from '../components/finance/CurrencySelector';
import { ExpenseCategoryPicker } from '../components/finance/ExpenseCategoryPicker';
import { Toast } from '../components/common/Toast';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type RootStackParamList = {
  RecurringExpenses: undefined;
  CreateRecurringExpense: undefined;
  EditRecurringExpense: { expenseId: string };
};

type Props = NativeStackScreenProps<
  RootStackParamList,
  'CreateRecurringExpense' | 'EditRecurringExpense'
>;

export function CreateRecurringExpenseScreen({ navigation, route }: Props) {
  const queryClient = useQueryClient();

  // Check if editing
  const expenseId =
    'params' in route && route.params && 'expenseId' in route.params
      ? route.params.expenseId
      : undefined;
  const isEditMode = !!expenseId;

  // Form state
  const [concept, setConcept] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [currency, setCurrency] = useState<Currency>('ARS');

  // Validation errors
  const [errors, setErrors] = useState<{
    concept?: string;
    categoryId?: string;
    currency?: string;
  }>({});

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Fetch expense data if editing
  const { data: existingExpense, isLoading: isLoadingExpense } = useQuery({
    queryKey: ['recurringExpense', expenseId],
    queryFn: () => getRecurringExpenseById(expenseId!),
    enabled: isEditMode,
  });

  // Populate form when editing
  useEffect(() => {
    if (existingExpense) {
      setConcept(existingExpense.concept);
      setCategoryId(existingExpense.categoryId);
      setCurrency(existingExpense.currency as Currency);
    }
  }, [existingExpense]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: createRecurringExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurringExpenses'] });
      setToast({ message: 'Plantilla creada exitosamente', type: 'success' });
      setTimeout(() => navigation.goBack(), 1500);
    },
    onError: (error: Error) => {
      const axiosError = error as { response?: { data?: { message?: string } } };
      setToast({
        message: axiosError.response?.data?.message || 'Error al crear plantilla',
        type: 'error',
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRecurringExpenseInput }) =>
      updateRecurringExpense(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurringExpenses'] });
      queryClient.invalidateQueries({ queryKey: ['recurringExpense', expenseId] });
      setToast({ message: 'Plantilla actualizada exitosamente', type: 'success' });
      setTimeout(() => navigation.goBack(), 1500);
    },
    onError: (error: Error) => {
      const axiosError = error as { response?: { data?: { message?: string } } };
      setToast({
        message: axiosError.response?.data?.message || 'Error al actualizar plantilla',
        type: 'error',
      });
    },
  });

  // Validate form
  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!concept.trim()) {
      newErrors.concept = 'El concepto es requerido';
    } else if (concept.length > 100) {
      newErrors.concept = 'El concepto no puede exceder 100 caracteres';
    }

    if (!categoryId) {
      newErrors.categoryId = 'Debe seleccionar una categoría';
    }

    if (!currency) {
      newErrors.currency = 'Debe seleccionar una moneda';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = () => {
    if (!validate()) {
      return;
    }

    const data: CreateRecurringExpenseInput = {
      concept: concept.trim(),
      categoryId,
      currency,
    };

    if (isEditMode && expenseId) {
      updateMutation.mutate({ id: expenseId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    // Check if form has changes
    if (concept || categoryId) {
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

  const isLoading = createMutation.isPending || updateMutation.isPending;

  if (isEditMode && isLoadingExpense) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Cargando plantilla...</Text>
      </View>
    );
  }

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
            placeholder="Ej: Alquiler, Netflix, Gimnasio"
            placeholderTextColor="#999"
            maxLength={100}
            editable={!isLoading}
          />
          {errors.concept && <Text style={styles.error}>{errors.concept}</Text>}
          <Text style={styles.hint}>{concept.length}/100 caracteres</Text>
        </View>

        {/* Category Picker */}
        <ExpenseCategoryPicker
          value={categoryId}
          onChange={(id) => {
            setCategoryId(id);
            if (errors.categoryId) {
              setErrors({ ...errors, categoryId: undefined });
            }
          }}
          error={errors.categoryId}
        />

        {/* Currency Selector */}
        <CurrencySelector
          value={currency}
          onChange={(curr) => {
            setCurrency(curr);
            if (errors.currency) {
              setErrors({ ...errors, currency: undefined });
            }
          }}
          error={errors.currency}
        />

        {/* Info Note */}
        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>💡</Text>
          <Text style={styles.infoText}>
            Las plantillas de gastos recurrentes se usarán para generar instancias mensuales
            automáticamente. Podrás modificar el monto al marcar cada gasto como pagado.
          </Text>
        </View>
      </ScrollView>

      {/* Footer with buttons */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel} disabled={isLoading}>
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.saveButtonText}>{isEditMode ? 'Actualizar' : 'Guardar'}</Text>
          )}
        </TouchableOpacity>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100, // Space for footer
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
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1976D2',
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
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
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#90CAF9',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});
