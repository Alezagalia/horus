/**
 * Routine API Service
 * Sprint 14 - US-137
 */

import { axiosInstance } from '@/lib/axios';
import type {
  Routine,
  RoutineSummary,
  RoutineDetail,
  RoutinesResponse,
  CreateRoutineDTO,
  UpdateRoutineDTO,
} from '@horus/shared';

/**
 * GET /api/routines
 * Obtiene todas las rutinas del usuario
 */
export async function getRoutines(): Promise<RoutineSummary[]> {
  const response = await axiosInstance.get<RoutinesResponse>('/routines');
  return response.data.routines;
}

/**
 * GET /api/routines/:id
 * Obtiene una rutina por ID con detalles completos
 */
export async function getRoutineById(id: string): Promise<RoutineDetail> {
  const response = await axiosInstance.get<{ routine: RoutineDetail }>(`/routines/${id}`);
  return response.data.routine;
}

/**
 * POST /api/routines
 * Crea una nueva rutina
 */
export async function createRoutine(data: CreateRoutineDTO): Promise<Routine> {
  const response = await axiosInstance.post<{ routine: Routine }>('/routines', data);
  return response.data.routine;
}

/**
 * PUT /api/routines/:id
 * Actualiza una rutina existente
 */
export async function updateRoutine(id: string, data: UpdateRoutineDTO): Promise<Routine> {
  const response = await axiosInstance.put<{ routine: Routine }>(`/routines/${id}`, data);
  return response.data.routine;
}

/**
 * DELETE /api/routines/:id
 * Elimina una rutina
 */
export async function deleteRoutine(id: string): Promise<void> {
  await axiosInstance.delete(`/routines/${id}`);
}

/**
 * POST /api/routines/:id/duplicate
 * Duplica una rutina existente
 */
export async function duplicateRoutine(id: string): Promise<Routine> {
  const response = await axiosInstance.post<{ routine: Routine }>(`/routines/${id}/duplicate`);
  return response.data.routine;
}
