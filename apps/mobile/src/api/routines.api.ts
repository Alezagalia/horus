/**
 * Routines API Service
 * Sprint 14 - US-133
 *
 * API client for routine endpoints using axios
 */

// Sprint 1: Use centralized axios instance with auth interceptors
import { apiClient } from '../lib/axios';
import type { Routine, CreateRoutineDTO, UpdateRoutineDTO } from '@horus/shared';

export interface RoutineWithStats extends Routine {
  exerciseCount?: number;
  lastExecuted?: string | null;
  timesExecuted?: number;
}

/**
 * Get all routines
 */
export const getRoutines = async (): Promise<RoutineWithStats[]> => {
  const response = await apiClient.get<{ routines: RoutineWithStats[] }>('/routines');
  return response.data.routines;
};

/**
 * Get routine by ID with exercises
 */
export const getRoutineById = async (id: string): Promise<Routine> => {
  const response = await apiClient.get<{ routine: Routine }>(`/routines/${id}`);
  return response.data.routine;
};

/**
 * Create new routine
 */
export const createRoutine = async (data: CreateRoutineDTO): Promise<Routine> => {
  const response = await apiClient.post<{ routine: Routine }>('/routines', data);
  return response.data.routine;
};

/**
 * Update routine
 */
export const updateRoutine = async (id: string, data: UpdateRoutineDTO): Promise<Routine> => {
  const response = await apiClient.put<{ routine: Routine }>(`/routines/${id}`, data);
  return response.data.routine;
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
  const response = await apiClient.post<{ routine: Routine }>(`/routines/${id}/duplicate`);
  return response.data.routine;
};
