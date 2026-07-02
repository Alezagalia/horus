import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import type { CreateSavingsGoalDTO, UpdateSavingsGoalDTO } from '@horus/shared';
import { useWatermelonQuery } from './useWatermelonQuery';
import { listSavingsGoalsLocal } from '@/db/moneyQueries';
import {
  createSavingsGoalLocal,
  updateSavingsGoalLocal,
  deleteSavingsGoalLocal,
} from '@/db/moneyWrites';

export const savingsGoalKeys = {
  all: ['savings-goals'] as const,
};

/** Offline-first: lee de WatermelonDB; el progreso sale del balance local. */
export function useSavingsGoals() {
  return useWatermelonQuery(savingsGoalKeys.all, listSavingsGoalsLocal, [
    'savings_goals',
    'accounts',
  ]);
}

export function useCreateSavingsGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateSavingsGoalDTO) => createSavingsGoalLocal(dto),
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
      updateSavingsGoalLocal(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: savingsGoalKeys.all });
    },
    onError: () => Alert.alert('Error', 'No se pudo actualizar la meta de ahorro'),
  });
}

export function useDeleteSavingsGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSavingsGoalLocal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: savingsGoalKeys.all });
    },
    onError: () => Alert.alert('Error', 'No se pudo eliminar la meta de ahorro'),
  });
}
