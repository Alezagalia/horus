/**
 * Exercises API Service
 * Sprint 14 - US-132
 *
 * API client for exercise endpoints using axios
 */

// Sprint 1: Use centralized axios instance with auth interceptors
import { apiClient } from '../lib/axios';
import type { Exercise, CreateExerciseDTO, UpdateExerciseDTO, MuscleGroup } from '@horus/shared';

export interface ExerciseFilters {
  muscleGroup?: MuscleGroup;
  search?: string;
}

export interface ExerciseWithUsage extends Exercise {
  usedInRoutines?: number;
}

/**
 * Get all exercises with optional filters
 */
export const getExercises = async (filters?: ExerciseFilters): Promise<ExerciseWithUsage[]> => {
  const params = new URLSearchParams();
  if (filters?.muscleGroup) params.append('muscleGroup', filters.muscleGroup);
  if (filters?.search) params.append('search', filters.search);

  const response = await apiClient.get<{ exercises: ExerciseWithUsage[] }>(`/exercises?${params.toString()}`);
  return response.data.exercises;
};

/**
 * Get exercise by ID
 */
export const getExerciseById = async (id: string): Promise<ExerciseWithUsage> => {
  const response = await apiClient.get<{ exercise: ExerciseWithUsage }>(`/exercises/${id}`);
  return response.data.exercise;
};

/**
 * Create new exercise
 */
export const createExercise = async (data: CreateExerciseDTO): Promise<Exercise> => {
  const response = await apiClient.post<{ exercise: Exercise }>('/exercises', data);
  return response.data.exercise;
};

/**
 * Update exercise
 */
export const updateExercise = async (id: string, data: UpdateExerciseDTO): Promise<Exercise> => {
  const response = await apiClient.put<{ exercise: Exercise }>(`/exercises/${id}`, data);
  return response.data.exercise;
};

/**
 * Delete exercise
 */
export const deleteExercise = async (id: string): Promise<void> => {
  await apiClient.delete(`/exercises/${id}`);
};
