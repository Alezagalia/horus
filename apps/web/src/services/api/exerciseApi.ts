/**
 * Exercise API Service
 * Sprint 14 - US-137
 */

import { axiosInstance } from '@/lib/axios';
import type {
  Exercise,
  ExerciseWithStats,
  ExerciseDetail,
  ExercisesResponse,
  CreateExerciseDTO,
  UpdateExerciseDTO,
  ExerciseFilters,
} from '@horus/shared';

/**
 * GET /api/exercises
 * Obtiene todos los ejercicios del usuario con stats opcionales
 */
export async function getExercises(filters?: ExerciseFilters): Promise<ExerciseWithStats[]> {
  const params: Record<string, string> = {};
  if (filters?.muscleGroup) {
    params.muscleGroup = filters.muscleGroup;
  }
  if (filters?.search) {
    params.search = filters.search;
  }

  const response = await axiosInstance.get<ExercisesResponse>('/exercises', { params });
  return response.data.exercises;
}

/**
 * GET /api/exercises/:id
 * Obtiene un ejercicio por ID con detalles completos
 */
export async function getExerciseById(id: string): Promise<ExerciseDetail> {
  const response = await axiosInstance.get<{ exercise: ExerciseDetail }>(`/exercises/${id}`);
  return response.data.exercise;
}

/**
 * POST /api/exercises
 * Crea un nuevo ejercicio
 */
export async function createExercise(data: CreateExerciseDTO): Promise<Exercise> {
  const response = await axiosInstance.post<{ exercise: Exercise }>('/exercises', data);
  return response.data.exercise;
}

/**
 * PUT /api/exercises/:id
 * Actualiza un ejercicio existente
 */
export async function updateExercise(id: string, data: UpdateExerciseDTO): Promise<Exercise> {
  const response = await axiosInstance.put<{ exercise: Exercise }>(`/exercises/${id}`, data);
  return response.data.exercise;
}

/**
 * DELETE /api/exercises/:id
 * Elimina un ejercicio
 */
export async function deleteExercise(id: string): Promise<void> {
  await axiosInstance.delete(`/exercises/${id}`);
}
