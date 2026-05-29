import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { exerciseApi } from '@/services/api/exerciseApi';
import type { CreateExerciseDTO, UpdateExerciseDTO, MuscleGroup } from '@horus/shared';

export const exerciseKeys = {
  all: ['exercises'] as const,
  list: (muscleGroup?: MuscleGroup) => [...exerciseKeys.all, 'list', muscleGroup ?? 'all'] as const,
};

export function useExercises(muscleGroup?: MuscleGroup) {
  return useQuery({
    queryKey: exerciseKeys.list(muscleGroup),
    queryFn: () => exerciseApi.list(muscleGroup ? { muscleGroup } : undefined),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateExerciseDTO) => exerciseApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: exerciseKeys.all });
    },
    onError: () => Alert.alert('Error', 'No se pudo crear el ejercicio'),
  });
}

export function useUpdateExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateExerciseDTO }) =>
      exerciseApi.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: exerciseKeys.all });
    },
    onError: () => Alert.alert('Error', 'No se pudo actualizar el ejercicio'),
  });
}

export function useDeleteExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => exerciseApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: exerciseKeys.all });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'No se pudo eliminar el ejercicio';
      Alert.alert('Error', msg);
    },
  });
}
