/**
 * Savings Goals React Query Hooks
 * Metas de Ahorro vinculadas a Cuentas
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  getSavingsGoals,
  createSavingsGoal,
  updateSavingsGoal,
  deleteSavingsGoal,
} from '@/services/api/savingsGoalApi';
import type { CreateSavingsGoalDTO, UpdateSavingsGoalDTO } from '@horus/shared';

export const savingsGoalKeys = {
  all: ['savings-goals'] as const,
};

export function useSavingsGoals() {
  return useQuery({
    queryKey: savingsGoalKeys.all,
    queryFn: getSavingsGoals,
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateSavingsGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSavingsGoalDTO) => createSavingsGoal(data),
    onSuccess: () => {
      toast.success('Meta de ahorro creada exitosamente');
      queryClient.invalidateQueries({ queryKey: savingsGoalKeys.all });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al crear meta de ahorro');
    },
  });
}

export function useUpdateSavingsGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSavingsGoalDTO }) =>
      updateSavingsGoal(id, data),
    onSuccess: () => {
      toast.success('Meta de ahorro actualizada exitosamente');
      queryClient.invalidateQueries({ queryKey: savingsGoalKeys.all });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al actualizar meta de ahorro');
    },
  });
}

export function useDeleteSavingsGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSavingsGoal(id),
    onSuccess: () => {
      toast.success('Meta de ahorro eliminada exitosamente');
      queryClient.invalidateQueries({ queryKey: savingsGoalKeys.all });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al eliminar meta de ahorro');
    },
  });
}
