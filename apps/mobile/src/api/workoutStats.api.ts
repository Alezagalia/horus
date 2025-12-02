/**
 * Workout Stats API Service
 * Sprint 14 - US-136
 *
 * API client for workout statistics endpoints
 */

import axios from 'axios';
import type { ExerciseStatsResponse, OverviewStatsResponse } from '@horus/shared';

// API base URL from environment variables
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// TODO: Add auth interceptor when authentication is implemented

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
