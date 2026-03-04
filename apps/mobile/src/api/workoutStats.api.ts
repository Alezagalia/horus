/**
 * Workout Stats API Service
 * Sprint 14 - US-136
 *
 * API client for workout statistics endpoints
 */

// Sprint 1: Use centralized axios instance with auth interceptors
import { apiClient } from '../lib/axios';
import type { ExerciseStatsResponse, OverviewStatsResponse } from '@horus/shared';

/**
 * Get overview stats (general)
 */
export const getOverviewStats = async (days: number = 30): Promise<OverviewStatsResponse> => {
  const response = await apiClient.get<OverviewStatsResponse>('/stats/overview', {
    params: { days },
  });
  return response.data;
};

/**
 * Get exercise-specific stats
 */
export const getExerciseStats = async (
  exerciseId: string,
  days: number = 90
): Promise<ExerciseStatsResponse> => {
  const response = await apiClient.get<ExerciseStatsResponse>(`/stats/exercises/${exerciseId}`, {
    params: { days },
  });
  return response.data;
};
