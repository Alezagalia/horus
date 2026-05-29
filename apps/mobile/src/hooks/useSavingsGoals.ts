import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { savingsGoalApi } from '@/services/api/savingsGoalApi';
import type { CreateSavingsGoalDTO, UpdateSavingsGoalDTO } from '@horus/shared';

export const savingsGoalKeys = {
  all: ['savings-goals'] as const,
};

export function useSavingsGoals() {
  return useQuery({
    queryKey: savingsGoalKeys.all,
    queryFn: () => savingsGoalApi.list(),
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateSavingsGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateSavingsGoalDTO) => savingsGoalApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: savingsGoalKeys.all });
    },
    onError: () => Alert.alert('Error', 'No se pudo crear la meta de ahorro'),
  });
}

export function useUpdateSavingsGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSavingsGoalDTO }) =>
      savingsGoalApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: savingsGoalKeys.all });
    },
    onError: () => Alert.alert('Error', 'No se pudo actualizar la meta de ahorro'),
  });
}

export function useDeleteSavingsGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => savingsGoalApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: savingsGoalKeys.all });
    },
    onError: () => Alert.alert('Error', 'No se pudo eliminar la meta de ahorro'),
  });
}
