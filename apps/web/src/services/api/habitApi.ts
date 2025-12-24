/**
 * Habit API Service
 * Sprint 11 - US-098, US-099
 */

import { axiosInstance } from '@/lib/axios';
import type { HabitFormData } from '@/types/habits';

// Types based on backend responses
export interface HabitRecord {
  id: string;
  habitId: string;
  userId: string;
  date: string;
  completed: boolean;
  value?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HabitFromAPI {
  id: string;
  userId: string;
  categoryId: string;
  name: string;
  description?: string;
  type: 'CHECK' | 'NUMERIC';
  targetValue?: number;
  unit?: string;
  periodicity: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';
  weekDays: number[];
  timeOfDay: 'AYUNO' | 'MANANA' | 'MEDIA_MANANA' | 'TARDE' | 'MEDIA_TARDE' | 'NOCHE' | 'ANTES_DORMIR' | 'ANYTIME';
  reminderTime?: string;
  color?: string;
  order: number;
  isActive: boolean;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate?: string;
  createdAt: string;
  updatedAt: string;
  category: {
    id: string;
    name: string;
    icon?: string;
    color?: string;
  };
}

export interface CreateHabitRecordDTO {
  date: string; // YYYY-MM-DD
  completed: boolean;
  value?: number;
  notes?: string;
}

export interface GetHabitsFilters {
  categoryId?: string;
}

/**
 * GET /api/habits
 * Obtiene todos los hábitos del usuario con filtros opcionales
 */
export async function getHabits(filters?: GetHabitsFilters): Promise<HabitFromAPI[]> {
  const params: Record<string, string> = {};
  if (filters?.categoryId) {
    params.categoryId = filters.categoryId;
  }

  const response = await axiosInstance.get<{ habits: HabitFromAPI[] }>('/habits', { params });
  return response.data.habits;
}

/**
 * GET /api/habits/:id
 * Obtiene un hábito por ID
 */
export async function getHabitById(id: string): Promise<HabitFromAPI> {
  const response = await axiosInstance.get<{ habit: HabitFromAPI }>(`/habits/${id}`);
  return response.data.habit;
}

/**
 * POST /api/habits
 * Crea un nuevo hábito
 */
export async function createHabit(data: HabitFormData): Promise<HabitFromAPI> {
  const response = await axiosInstance.post<{ habit: HabitFromAPI }>('/habits', data);
  return response.data.habit;
}

/**
 * PUT /api/habits/:id
 * Actualiza un hábito existente
 */
export async function updateHabit(id: string, data: Partial<HabitFormData>): Promise<HabitFromAPI> {
  const response = await axiosInstance.put<{ habit: HabitFromAPI }>(`/habits/${id}`, data);
  return response.data.habit;
}

/**
 * DELETE /api/habits/:id
 * Elimina (soft delete) un hábito
 */
export async function deleteHabit(id: string): Promise<void> {
  await axiosInstance.delete(`/habits/${id}`);
}

/**
 * POST /api/habits/:id/reactivate
 * Reactiva un hábito previamente eliminado
 */
export async function reactivateHabit(id: string, reason?: string): Promise<HabitFromAPI> {
  const response = await axiosInstance.post<{ habit: HabitFromAPI }>(`/habits/${id}/reactivate`, { reason });
  return response.data.habit;
}

// ==================== Habit Records ====================

/**
 * POST /api/habits/:id/records
 * Crea o actualiza un registro de hábito para una fecha específica
 */
export async function createOrUpdateRecord(habitId: string, data: CreateHabitRecordDTO): Promise<HabitRecord> {
  const response = await axiosInstance.post<{ record: HabitRecord }>(`/habits/${habitId}/records`, data);
  return response.data.record;
}

/**
 * GET /api/habits/:id/records/:date
 * Obtiene el registro de un hábito para una fecha específica
 */
export async function getRecordByDate(habitId: string, date: string): Promise<HabitRecord | null> {
  try {
    const response = await axiosInstance.get<{ record: HabitRecord | null }>(`/habits/${habitId}/records/${date}`);
    return response.data.record;
  } catch (error) {
    // 404 means no record for that date
    return null;
  }
}

/**
 * GET /api/habits/:id/records
 * Obtiene registros de un hábito en un rango de fechas
 */
export async function getRecordsByDateRange(
  habitId: string,
  startDate: string,
  endDate: string
): Promise<HabitRecord[]> {
  const response = await axiosInstance.get<{ records: HabitRecord[] }>(`/habits/${habitId}/records`, {
    params: { startDate, endDate },
  });
  return response.data.records;
}

/**
 * PUT /api/habits/:id/daily/:date/progress
 * Actualiza el progreso incremental de un hábito NUMERIC
 */
export async function updateProgress(
  habitId: string,
  date: string,
  increment: number
): Promise<{ record: HabitRecord; progressPercentage: number; autoCompleted: boolean }> {
  const response = await axiosInstance.put<{
    record: HabitRecord;
    progressPercentage: number;
    autoCompleted: boolean;
  }>(`/habits/${habitId}/daily/${date}/progress`, { increment });
  return response.data;
}

// ==================== Stats ====================

export interface HabitStats {
  today: {
    total: number;
    completed: number;
    percentage: number;
  };
  streaks: {
    currentBest: {
      habitId: string;
      habitName: string;
      streak: number;
    } | null;
    longestEver: {
      habitId: string;
      habitName: string;
      streak: number;
    } | null;
  };
  last7Days: {
    date: string;
    total: number;
    completed: number;
  }[];
  byCategory: {
    categoryId: string;
    categoryName: string;
    total: number;
    completed: number;
  }[];
}

/**
 * GET /api/habits/stats
 * Obtiene estadísticas generales de hábitos
 */
export async function getHabitStats(): Promise<HabitStats> {
  const response = await axiosInstance.get<HabitStats>('/habits/stats');
  return response.data;
}

/**
 * GET /api/habits/:id/stats
 * Obtiene estadísticas detalladas de un hábito específico
 */
export async function getHabitDetailedStats(habitId: string): Promise<unknown> {
  const response = await axiosInstance.get(`/habits/${habitId}/stats`);
  return response.data;
}

// ==================== Reorder ====================

export type TimeOfDay = 'AYUNO' | 'MANANA' | 'MEDIA_MANANA' | 'TARDE' | 'MEDIA_TARDE' | 'NOCHE' | 'ANTES_DORMIR' | 'ANYTIME';

export interface ReorderHabitsDTO {
  timeOfDay: TimeOfDay;
  habitIds: string[];
}

/**
 * PUT /api/habits/reorder
 * Reordena los hábitos dentro de un momento del día específico
 */
export async function reorderHabits(data: ReorderHabitsDTO): Promise<{ success: boolean; reorderedCount: number }> {
  const response = await axiosInstance.put<{ message: string; success: boolean; reorderedCount: number }>(
    '/habits/reorder',
    data
  );
  return response.data;
}
