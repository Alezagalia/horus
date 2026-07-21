import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useWatermelonQuery } from './useWatermelonQuery';
import {
  listRoutinesLocal,
  getRoutineDetailLocal,
  listWorkoutsLocal,
  getWorkoutDetailLocal,
} from '@/db/fitnessQueries';
import {
  createRoutineLocal,
  updateRoutineLocal,
  deleteRoutineLocal,
  startWorkoutLocal,
  finishWorkoutLocal,
  cancelWorkoutLocal,
  addSetLocal,
  deleteSetLocal,
} from '@/db/fitnessWrites';
import type { AddSetDTO } from '@/services/api/workoutApi';
import type { CreateRoutineDTO, UpdateRoutineDTO } from '@horus/shared';

/**
 * Fitness offline-first: lecturas desde SQLite local (useWatermelonQuery) y
 * escrituras locales que disparan el sync. Mismas keys y firmas que la
 * versión REST: la UI no cambia.
 */

export const workoutKeys = {
  all: ['workouts'] as const,
  routines: () => [...workoutKeys.all, 'routines'] as const,
  routineDetail: (id: string) => [...workoutKeys.all, 'routines', id] as const,
  history: (params?: object) => [...workoutKeys.all, 'history', params] as const,
  detail: (id: string) => [...workoutKeys.all, 'detail', id] as const,
};

const ROUTINE_TABLES = ['routines', 'routine_exercises', 'exercises', 'workouts'];
const WORKOUT_TABLES = ['workouts', 'workout_exercises', 'workout_sets', 'exercises', 'routines'];

export function useRoutines() {
  return useWatermelonQuery(workoutKeys.routines(), () => listRoutinesLocal(), ROUTINE_TABLES);
}

export function useRoutineDetail(id: string | undefined) {
  return useWatermelonQuery(
    workoutKeys.routineDetail(id ?? ''),
    () => (id ? getRoutineDetailLocal(id) : Promise.resolve(null)),
    ROUTINE_TABLES
  );
}

export function useCreateRoutine() {
  return useMutation({ mutationFn: (dto: CreateRoutineDTO) => createRoutineLocal(dto) });
}

export function useUpdateRoutine() {
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateRoutineDTO }) => updateRoutineLocal(id, dto),
  });
}

export function useDeleteRoutine() {
  return useMutation({ mutationFn: (id: string) => deleteRoutineLocal(id) });
}

export function useWorkoutDetail(id: string) {
  return useWatermelonQuery(
    workoutKeys.detail(id),
    () => (id ? getWorkoutDetailLocal(id) : Promise.resolve(null)),
    WORKOUT_TABLES
  );
}

export function useWorkoutHistory(params?: { page?: number; limit?: number }) {
  return useWatermelonQuery(
    workoutKeys.history(params),
    () => listWorkoutsLocal(params),
    WORKOUT_TABLES
  );
}

export function useStartWorkout() {
  return useMutation({ mutationFn: (routineId: string) => startWorkoutLocal(routineId) });
}

export function useFinishWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (workoutId: string) => finishWorkoutLocal(workoutId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workoutKeys.all });
    },
  });
}

export function useCancelWorkout() {
  return useMutation({ mutationFn: (workoutId: string) => cancelWorkoutLocal(workoutId) });
}

// Set mutations — la pantalla activa actualiza su estado con la respuesta
export function useAddSet() {
  return useMutation({
    mutationFn: ({
      workoutExerciseId,
      dto,
    }: {
      workoutId: string;
      workoutExerciseId: string;
      dto: AddSetDTO;
    }) => addSetLocal(workoutExerciseId, dto),
  });
}

export function useDeleteSet() {
  return useMutation({
    mutationFn: ({ setId }: { workoutId: string; workoutExerciseId: string; setId: string }) =>
      deleteSetLocal(setId),
  });
}
