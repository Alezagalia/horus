/**
 * Workouts API Service
 * Sprint 14 - US-134, US-135
 *
 * API client for workout execution and history endpoints
 */

import axios from 'axios';
import type { WorkoutListItem, WorkoutListResponse, WorkoutDetailResponse } from '@horus/shared';

// API base URL from environment variables
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// TODO: Add auth interceptor when authentication is implemented

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

export interface AddSetInput {
  reps: number;
  weight: number;
}

/**
 * Start workout from routine
 */
export const startWorkout = async (routineId: string): Promise<StartWorkoutResponse> => {
  const response = await apiClient.post<StartWorkoutResponse>(`/routines/${routineId}/start`);
  return response.data;
};

/**
 * Add set to workout exercise
 */
export const addSet = async (
  workoutId: string,
  exerciseId: string,
  data: AddSetInput
): Promise<void> => {
  await apiClient.post(`/workouts/${workoutId}/exercises/${exerciseId}/sets`, data);
};

/**
 * Finish workout
 */
export const finishWorkout = async (
  workoutId: string,
  notes?: string
): Promise<{ summary: any }> => {
  const response = await apiClient.put(`/workouts/${workoutId}/finish`, {
    notes: notes || null,
  });
  return response.data;
};

/**
 * Cancel workout (delete)
 */
export const cancelWorkout = async (workoutId: string): Promise<void> => {
  await apiClient.delete(`/workouts/${workoutId}`);
};

// ============================================
// US-135: Workout History
// ============================================

export interface ListWorkoutsFilters {
  days?: number; // 7, 30, 90, or undefined for all
  routineId?: string;
  page?: number;
  limit?: number;
}

/**
 * List workouts with filters
 */
export const listWorkouts = async (filters?: ListWorkoutsFilters): Promise<WorkoutListResponse> => {
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

  const response = await apiClient.get<WorkoutListResponse>(`/workouts?${params.toString()}`);
  return response.data;
};

/**
 * Get workout detail by ID
 */
export const getWorkoutById = async (workoutId: string): Promise<WorkoutDetailResponse> => {
  const response = await apiClient.get<WorkoutDetailResponse>(`/workouts/${workoutId}`);
  return response.data;
};
