/**
 * Workout Stats API Service
 * Sprint 14 - US-139
 */

import { axiosInstance } from '@/lib/axios';
import type { ExerciseStatsResponse, OverviewStatsResponse } from '@horus/shared';

/**
 * GET /api/stats/overview
 * Obtiene estadísticas generales de workouts
 */
export async function getOverviewStats(days: number = 30): Promise<OverviewStatsResponse> {
  const response = await axiosInstance.get<OverviewStatsResponse>('/stats/overview', {
    params: { days },
  });
  return response.data;
}

/**
 * GET /api/stats/exercises/:exerciseId
 * Obtiene estadísticas específicas de un ejercicio
 */
export async function getExerciseStats(
  exerciseId: string,
  days: number = 90
): Promise<ExerciseStatsResponse> {
  const response = await axiosInstance.get<ExerciseStatsResponse>(
    `/stats/exercises/${exerciseId}`,
    {
      params: { days },
    }
  );
  return response.data;
}
