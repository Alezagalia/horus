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
  workout: {
    id: string;
    routineId: string;
    routineName: string;
    startTime: string;
    endTime: string | null;
  };
  exercises: Array<{
    workoutExerciseId: string;
    exerciseId: string;
    exerciseName: string;
    muscleGroup: string | null;
    order: number;
    targetSets: number | null;
    targetReps: number | null;
    targetWeight: number | null;
    restTime: number | null;
    notes: string | null;
    lastWorkoutData: {
      date: string;
      lastReps: number;
      lastWeight: number;
      lastWeightUnit: string;
      avgReps: number;
      avgWeight: number;
      maxWeight: number;
      totalSets: number;
      allSets: Array<{
        setNumber: number;
        reps: number;
        weight: number;
      }>;
    } | null;
    sets: Array<any>;
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
 * PUT /api/workouts/:workoutId/finish
 * Finaliza el workout
 */
export async function finishWorkout(workoutId: string, notes?: string): Promise<void> {
  await axiosInstance.put(`/workouts/${workoutId}/finish`, { notes });
}

/**
 * DELETE /api/workouts/:workoutId/cancel
 * Cancela el workout
 */
export async function cancelWorkout(workoutId: string): Promise<void> {
  await axiosInstance.delete(`/workouts/${workoutId}/cancel`);
}
