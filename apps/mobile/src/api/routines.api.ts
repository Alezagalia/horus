/**
 * Routines API Service
 * Sprint 14 - US-133
 *
 * API client for routine endpoints using axios
 */

import axios from 'axios';
import type { Routine, CreateRoutineDTO, UpdateRoutineDTO } from '@horus/shared';

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

export interface RoutineWithStats extends Routine {
  exerciseCount?: number;
  lastExecuted?: string | null;
  timesExecuted?: number;
}

/**
 * Get all routines
 */
export const getRoutines = async (): Promise<RoutineWithStats[]> => {
  const response = await apiClient.get<RoutineWithStats[]>('/routines');
  return response.data;
};

/**
 * Get routine by ID with exercises
 */
export const getRoutineById = async (id: string): Promise<Routine> => {
  const response = await apiClient.get<Routine>(`/routines/${id}`);
  return response.data;
};

/**
 * Create new routine
 */
export const createRoutine = async (data: CreateRoutineDTO): Promise<Routine> => {
  const response = await apiClient.post<Routine>('/routines', data);
  return response.data;
};

/**
 * Update routine
 */
export const updateRoutine = async (id: string, data: UpdateRoutineDTO): Promise<Routine> => {
  const response = await apiClient.put<Routine>(`/routines/${id}`, data);
  return response.data;
};

/**
 * Delete routine
 */
export const deleteRoutine = async (id: string): Promise<void> => {
  await apiClient.delete(`/routines/${id}`);
};

/**
 * Duplicate routine
 */
export const duplicateRoutine = async (id: string): Promise<Routine> => {
  const response = await apiClient.post<Routine>(`/routines/${id}/duplicate`);
  return response.data;
};
