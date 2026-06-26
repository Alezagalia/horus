import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  workoutApi,
  type AddSetDTO,
  type CreateRoutineDTO,
  type UpdateRoutineDTO,
} from '@/services/api/workoutApi';

export const workoutKeys = {
  all: ['workouts'] as const,
  routines: () => [...workoutKeys.all, 'routines'] as const,
  routineDetail: (id: string) => [...workoutKeys.all, 'routines', id] as const,
  history: (params?: object) => [...workoutKeys.all, 'history', params] as const,
  detail: (id: string) => [...workoutKeys.all, 'detail', id] as const,
};

export function useRoutines() {
  return useQuery({
    queryKey: workoutKeys.routines(),
    queryFn: workoutApi.listRoutines,
    staleTime: 1000 * 60 * 5,
  });
}

export function useRoutineDetail(id: string | undefined) {
  return useQuery({
    queryKey: workoutKeys.routineDetail(id ?? ''),
    queryFn: () => workoutApi.getRoutineById(id!),
    staleTime: 1000 * 60 * 2,
    enabled: !!id,
  });
}

export function useCreateRoutine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateRoutineDTO) => workoutApi.createRoutine(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workoutKeys.all });
    },
  });
}

export function useUpdateRoutine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateRoutineDTO }) =>
      workoutApi.updateRoutine(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workoutKeys.all });
    },
  });
}

export function useDeleteRoutine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => workoutApi.deleteRoutine(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workoutKeys.all });
    },
  });
}

export function useWorkoutDetail(id: string) {
  return useQuery({
    queryKey: workoutKeys.detail(id),
    queryFn: () => workoutApi.getWorkoutById(id),
    staleTime: 10 * 60 * 1000,
    enabled: !!id,
  });
}

export function useWorkoutHistory(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: workoutKeys.history(params),
    queryFn: () => workoutApi.listWorkouts(params),
    staleTime: 1000 * 60 * 2,
  });
}

export function useStartWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (routineId: string) => workoutApi.startWorkout(routineId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workoutKeys.all });
    },
  });
}

export function useFinishWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (workoutId: string) => workoutApi.finishWorkout(workoutId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workoutKeys.all });
    },
  });
}

export function useCancelWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (workoutId: string) => workoutApi.cancelWorkout(workoutId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workoutKeys.all });
    },
  });
}

// Set mutations — no auto-invalidate; callers update local state from response
export function useAddSet() {
  return useMutation({
    mutationFn: ({
      workoutId,
      workoutExerciseId,
      dto,
    }: {
      workoutId: string;
      workoutExerciseId: string;
      dto: AddSetDTO;
    }) => workoutApi.addSet(workoutId, workoutExerciseId, dto),
  });
}

export function useDeleteSet() {
  return useMutation({
    mutationFn: ({
      workoutId,
      workoutExerciseId,
      setId,
    }: {
      workoutId: string;
      workoutExerciseId: string;
      setId: string;
    }) => workoutApi.deleteSet(workoutId, workoutExerciseId, setId),
  });
}
