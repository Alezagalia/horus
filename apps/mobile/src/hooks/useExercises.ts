import { useMutation } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { useWatermelonQuery } from './useWatermelonQuery';
import { listExercisesLocal } from '@/db/fitnessQueries';
import { createExerciseLocal, updateExerciseLocal, deleteExerciseLocal } from '@/db/fitnessWrites';
import type { CreateExerciseDTO, UpdateExerciseDTO, MuscleGroup } from '@horus/shared';

/**
 * Ejercicios offline-first. `useExercises` mantiene la forma de la respuesta
 * REST (`{ exercises: ExerciseWithStats[] }`) para que la UI no cambie.
 */

export const exerciseKeys = {
  all: ['exercises'] as const,
  list: (muscleGroup?: MuscleGroup) => [...exerciseKeys.all, 'list', muscleGroup ?? 'all'] as const,
};

const EXERCISE_TABLES = ['exercises', 'routine_exercises', 'workout_exercises', 'workouts'];

export function useExercises(muscleGroup?: MuscleGroup) {
  return useWatermelonQuery(
    exerciseKeys.list(muscleGroup),
    async () => ({ exercises: await listExercisesLocal(muscleGroup) }),
    EXERCISE_TABLES
  );
}

export function useCreateExercise() {
  return useMutation({
    mutationFn: (dto: CreateExerciseDTO) => createExerciseLocal(dto),
    onError: () => Alert.alert('Error', 'No se pudo crear el ejercicio'),
  });
}

export function useUpdateExercise() {
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateExerciseDTO }) =>
      updateExerciseLocal(id, dto),
    onError: () => Alert.alert('Error', 'No se pudo actualizar el ejercicio'),
  });
}

export function useDeleteExercise() {
  return useMutation({
    mutationFn: (id: string) => deleteExerciseLocal(id),
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'No se pudo eliminar el ejercicio';
      Alert.alert('Error', msg);
    },
  });
}
