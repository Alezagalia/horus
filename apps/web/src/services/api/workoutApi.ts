/**
 * Workout API Service
 * Sprint 14 - US-138
 */

import { axiosInstance } from '@/lib/axios';

export interface AddSetInput {
  reps: number;
  weight: number;
}

export interface StartWorkoutResponse {
  workoutId: string;
  routine: {
    id: string;
    name: string;
    exercises: Array<{
      id: string;
      order: number;
      exerciseId: string;
      exercise: {
        id: string;
        name: string;
        muscleGroup: string | null;
      };
      targetSets: number | null;
      targetReps: number | null;
      targetWeight: number | null;
      restTime: number | null;
      notes: string | null;
    }>;
  };
  history: Array<{
    date: string;
    exerciseId: string;
    sets: Array<{
      reps: number;
      weight: number;
    }>;
  }>;
}

/**
 * POST /api/routines/:routineId/start
 * Inicia un nuevo workout desde una rutina
 */
export async function startWorkout(routineId: string): Promise<StartWorkoutResponse> {
  const response = await axiosInstance.post<StartWorkoutResponse>(`/routines/${routineId}/start`);
  return response.data;
}

/**
 * POST /api/workouts/:workoutId/exercises/:exerciseId/sets
 * Añade una serie a un ejercicio del workout
 */
export async function addSet(
  workoutId: string,
  workoutExerciseId: string,
  data: AddSetInput
): Promise<void> {
  await axiosInstance.post(`/workouts/${workoutId}/exercises/${workoutExerciseId}/sets`, data);
}

/**
 * DELETE /api/workouts/:workoutId/exercises/:workoutExerciseId/sets/:setId
 * Elimina una serie
 */
export async function deleteSet(
  workoutId: string,
  workoutExerciseId: string,
  setId: string
): Promise<void> {
  await axiosInstance.delete(`/workouts/${workoutId}/exercises/${workoutExerciseId}/sets/${setId}`);
}

/**
 * POST /api/workouts/:workoutId/finish
 * Finaliza el workout
 */
export async function finishWorkout(workoutId: string, notes?: string): Promise<void> {
  await axiosInstance.post(`/workouts/${workoutId}/finish`, { notes });
}

/**
 * DELETE /api/workouts/:workoutId/cancel
 * Cancela el workout
 */
export async function cancelWorkout(workoutId: string): Promise<void> {
  await axiosInstance.delete(`/workouts/${workoutId}/cancel`);
}
