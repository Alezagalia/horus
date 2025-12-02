/**
 * RecurringExpensesScreen
 * Sprint 10 - US-088
 *
 * Screen to display and manage recurring expense templates
 */

import { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getRecurringExpenses,
  deleteRecurringExpense,
  type RecurringExpense,
} from '../api/recurringExpenses.api';
import { RecurringExpenseCard } from '../components/finance/RecurringExpenseCard';
import { EmptyState } from '../components/common/EmptyState';
import { Toast } from '../components/common/Toast';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

// TODO: Define navigation types properly in a shared types file
type RootStackParamList = {
  RecurringExpenses: undefined;
  CreateRecurringExpense: undefined;
  EditRecurringExpense: { expenseId: string };
};

type RecurringExpensesScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'RecurringExpenses'
>;

interface RecurringExpensesScreenProps {
  navigation: RecurringExpensesScreenNavigationProp;
}

export function RecurringExpensesScreen({ navigation }: RecurringExpensesScreenProps) {
  const [showInactive, setShowInactive] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const queryClient = useQueryClient();

  // React Query for data fetching
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['recurringExpenses', showInactive],
    queryFn: () => getRecurringExpenses({ activeOnly: !showInactive }),
  });

  const expenses = data?.recurringExpenses || [];

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteRecurringExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurringExpenses'] });
      setToast({ message: 'Plantilla eliminada exitosamente', type: 'success' });
    },
    onError: (error: Error) => {
      const axiosError = error as { response?: { data?: { message?: string } } };
      setToast({
        message: axiosError.response?.data?.message || 'Error al eliminar plantilla',
        type: 'error',
      });
    },
  });

  const handleExpensePress = (expense: RecurringExpense) => {
    // TODO: Navigate to detail or edit screen when implemented
    // eslint-disable-next-line no-console
    console.log('Expense pressed:', expense.id);
  };

  const handleEdit = (expense: RecurringExpense) => {
    // TODO: Navigate to edit screen when implemented
    navigation.navigate('EditRecurringExpense', { expenseId: expense.id });
  };

  const handleDelete = (expense: RecurringExpense) => {
    Alert.alert(
      'Eliminar plantilla',
      `¿Estás seguro que deseas eliminar "${expense.concept}"? Esta acción no se puede deshacer.`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(expense.id),
        },
      ]
    );
  };

  const handleCreateNew = () => {
    // TODO: Navigate to create screen when implemented
    navigation.navigate('CreateRecurringExpense');
  };

  const toggleShowInactive = () => {
    setShowInactive((prev) => !prev);
  };

  const renderExpense = ({ item }: { item: RecurringExpense }) => (
    <RecurringExpenseCard
      expense={item}
      onPress={handleExpensePress}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );

  const renderEmptyState = () => (
    <EmptyState
      icon="💰"
      title="No tienes plantillas de gastos recurrentes"
      description="Crea tu primera plantilla para gestionar gastos mensuales como alquiler, servicios, suscripciones, etc."
      actionLabel="Crear plantilla"
      onAction={handleCreateNew}
    />
  );

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Cargando plantillas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with toggle */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Plantillas de Gastos Recurrentes</Text>
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={toggleShowInactive}
          activeOpacity={0.7}
        >
          <Text style={styles.toggleText}>
            {showInactive ? 'Ocultar inactivas' : 'Mostrar inactivas'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Expense List */}
      <FlatList
        data={expenses}
        renderItem={renderExpense}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        ListEmptyComponent={renderEmptyState}
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={handleCreateNew}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          visible={!!toast}
          onHide={() => setToast(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    flex: 1,
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#E3F2FD',
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1976D2',
  },
  list: {
    padding: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 28,
    color: '#fff',
    fontWeight: '300',
  },
});
