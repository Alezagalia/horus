/**
 * Workout History API Service
 * Sprint 14 - US-139
 */

import { axiosInstance } from '@/lib/axios';
import type { WorkoutListResponse, WorkoutDetailResponse } from '@horus/shared';

export interface ListWorkoutsFilters {
  days?: number;
  routineId?: string;
  page?: number;
  limit?: number;
}

/**
 * GET /api/workouts
 * Lista de workouts con filtros y paginación
 */
export async function listWorkouts(filters?: ListWorkoutsFilters): Promise<WorkoutListResponse> {
  const params = new URLSearchParams();

  if (filters?.days) {
    params.append('days', filters.days.toString());
  }
  if (filters?.routineId) {
    params.append('routineId', filters.routineId);
  }
  if (filters?.page) {
    params.append('page', filters.page.toString());
  }
  if (filters?.limit) {
    params.append('limit', filters.limit.toString());
  }

  const response = await axiosInstance.get<WorkoutListResponse>(`/workouts?${params.toString()}`);
  return response.data;
}

/**
 * GET /api/workouts/:id
 * Obtiene el detalle completo de un workout
 */
export async function getWorkoutById(workoutId: string): Promise<WorkoutDetailResponse> {
  const response = await axiosInstance.get<WorkoutDetailResponse>(`/workouts/${workoutId}`);
  return response.data;
}
