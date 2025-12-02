/**
 * Exercises API Service
 * Sprint 14 - US-132
 *
 * API client for exercise endpoints using axios
 */

import axios from 'axios';
import type { Exercise, CreateExerciseDTO, UpdateExerciseDTO, MuscleGroup } from '@horus/shared';

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
// apiClient.interceptors.request.use((config) => {
//   const token = await getStoredToken();
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

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

  const response = await apiClient.get<ExerciseWithUsage[]>(`/exercises?${params.toString()}`);
  return response.data;
};

/**
 * Get exercise by ID
 */
export const getExerciseById = async (id: string): Promise<ExerciseWithUsage> => {
  const response = await apiClient.get<ExerciseWithUsage>(`/exercises/${id}`);
  return response.data;
};

/**
 * Create new exercise
 */
export const createExercise = async (data: CreateExerciseDTO): Promise<Exercise> => {
  const response = await apiClient.post<Exercise>('/exercises', data);
  return response.data;
};

/**
 * Update exercise
 */
export const updateExercise = async (id: string, data: UpdateExerciseDTO): Promise<Exercise> => {
  const response = await apiClient.put<Exercise>(`/exercises/${id}`, data);
  return response.data;
};

/**
 * Delete exercise
 */
export const deleteExercise = async (id: string): Promise<void> => {
  await apiClient.delete(`/exercises/${id}`);
};
