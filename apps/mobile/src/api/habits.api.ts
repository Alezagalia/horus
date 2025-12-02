/**
 * Habits API Client
 * Sprint 3 - US-022
 */

import axios from 'axios';

const API_URL = 'http://localhost:3001/api/v1';

// TODO: Get token from secure storage (AsyncStorage/SecureStore)
const getAuthToken = () => {
  return 'dummy-token-for-development';
};

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface Habit {
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
  timeOfDay: 'MANANA' | 'TARDE' | 'NOCHE' | 'ANYTIME';
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
    scope: string;
  };
}

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
  habit: {
    id: string;
    name: string;
    type: 'CHECK' | 'NUMERIC';
    targetValue?: number;
    unit?: string;
    currentStreak: number;
    longestStreak: number;
  };
}

export interface CreateHabitDTO {
  categoryId: string;
  name: string;
  description?: string;
  type: 'CHECK' | 'NUMERIC';
  targetValue?: number;
  unit?: string;
  periodicity?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';
  weekDays?: number[];
  timeOfDay?: 'MANANA' | 'TARDE' | 'NOCHE' | 'ANYTIME';
  reminderTime?: string;
  color?: string;
  order?: number;
  isActive?: boolean;
}

export interface HabitsFilters {
  categoryId?: string;
}

export const getHabits = async (filters?: HabitsFilters): Promise<Habit[]> => {
  const params = new URLSearchParams();
  if (filters?.categoryId) {
    params.append('categoryId', filters.categoryId);
  }

  const response = await api.get<{ habits: Habit[] }>(
    `/habits${params.toString() ? `?${params.toString()}` : ''}`
  );
  return response.data.habits;
};

export const getHabitById = async (id: string): Promise<Habit> => {
  const response = await api.get<{ habit: Habit }>(`/habits/${id}`);
  return response.data.habit;
};

export const createHabit = async (data: CreateHabitDTO): Promise<Habit> => {
  const response = await api.post<{ habit: Habit }>('/habits', data);
  return response.data.habit;
};

export const updateHabit = async (id: string, data: Partial<CreateHabitDTO>): Promise<Habit> => {
  const response = await api.put<{ habit: Habit }>(`/habits/${id}`, data);
  return response.data.habit;
};

export const deleteHabit = async (id: string): Promise<void> => {
  await api.delete(`/habits/${id}`);
};

// ==================== HabitRecord endpoints (Sprint 4 - US-029, US-030, US-032, US-033) ====================

export interface CreateHabitRecordDTO {
  date?: string; // ISO date string (YYYY-MM-DD)
  completed: boolean;
  value?: number;
  notes?: string;
}

export interface UpdateProgressDTO {
  increment: number;
}

export interface UpdateProgressResponse {
  record: HabitRecord;
  progressPercentage: number | null;
  autoCompleted: boolean;
}

/**
 * Create or update a habit record for a specific date
 * US-029
 */
export const createOrUpdateHabitRecord = async (
  habitId: string,
  data: CreateHabitRecordDTO
): Promise<HabitRecord> => {
  const response = await api.post<{ record: HabitRecord }>(`/habits/${habitId}/records`, data);
  return response.data.record;
};

/**
 * Mark habit for a specific date (retroactive marking)
 * US-030
 */
export const markHabitForDate = async (
  habitId: string,
  date: string,
  data: Omit<CreateHabitRecordDTO, 'date'>
): Promise<HabitRecord> => {
  const response = await api.put<{ record: HabitRecord }>(`/habits/${habitId}/daily/${date}`, data);
  return response.data.record;
};

/**
 * Update progress incrementally for NUMERIC habits
 * US-032
 */
export const updateHabitProgress = async (
  habitId: string,
  date: string,
  data: UpdateProgressDTO
): Promise<UpdateProgressResponse> => {
  const response = await api.put<UpdateProgressResponse>(
    `/habits/${habitId}/daily/${date}/progress`,
    data
  );
  return response.data;
};

/**
 * Get habit record for a specific date
 * US-029
 */
export const getHabitRecordByDate = async (
  habitId: string,
  date: string
): Promise<HabitRecord | null> => {
  try {
    const response = await api.get<{ record: HabitRecord }>(`/habits/${habitId}/records/${date}`);
    return response.data.record;
  } catch (error) {
    // 404 means no record exists for that date
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

/**
 * Get habit records for a date range
 * US-029
 */
export const getHabitRecordsByDateRange = async (
  habitId: string,
  startDate: string,
  endDate: string
): Promise<HabitRecord[]> => {
  const response = await api.get<{ records: HabitRecord[] }>(`/habits/${habitId}/records`, {
    params: { startDate, endDate },
  });
  return response.data.records;
};

// ==================== Stats endpoints (Sprint 5 - US-037, US-041) ====================

export interface GeneralStats {
  completionRateToday: {
    completed: number;
    total: number;
    percentage: number;
  };
  longestCurrentStreak: {
    habitId: string | null;
    habitName: string | null;
    streak: number;
  };
  last7Days: Array<{
    date: string;
    completed: number;
    total: number;
    percentage: number;
  }>;
  statsByCategory: Array<{
    categoryId: string;
    categoryName: string;
    completed: number;
    total: number;
    percentage: number;
  }>;
}

/**
 * Get general statistics for the authenticated user
 * US-037, US-041
 */
export const getGeneralStats = async (): Promise<GeneralStats> => {
  const response = await api.get<GeneralStats>('/habits/stats');
  return response.data;
};

/**
 * Habit-specific stats interface
 * US-038, US-042
 */
export interface HabitStats {
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  overallCompletionRate: number;
  last30DaysRate: number;
  last30DaysData: Array<{
    date: string;
    completed: boolean;
    value: number | null;
    shouldComplete: boolean;
  }>;
  averageValue?: number | null;
  minValue?: number | null;
  maxValue?: number | null;
  last30DaysValues?: Array<{
    date: string;
    value: number | null;
  }>;
}

/**
 * Get detailed statistics for a specific habit
 * US-038, US-042
 */
export const getHabitStats = async (habitId: string): Promise<HabitStats> => {
  const response = await api.get<HabitStats>(`/habits/${habitId}/stats`);
  return response.data;
};

// ==================== Retroactive marking (Sprint 5 - US-040, US-043) ====================

export interface RetroactiveMarkingResponse {
  success: boolean;
  currentStreak: number;
  longestStreak: number;
  recordId: string;
}

/**
 * Mark habit retroactively with full streak recalculation
 * US-040, US-043
 */
export const markHabitRetroactively = async (
  habitId: string,
  data: CreateHabitRecordDTO
): Promise<RetroactiveMarkingResponse> => {
  const response = await api.post<RetroactiveMarkingResponse>(
    `/habits/${habitId}/records/retroactive`,
    data
  );
  return response.data;
};

// ==================== Habit Audit (Sprint 6 - US-048, US-052) ====================

export interface HabitAuditLog {
  id: string;
  changeType: 'CREATED' | 'UPDATED' | 'DELETED' | 'REACTIVATED';
  fieldChanged: string | null;
  oldValue: unknown;
  newValue: unknown;
  reason: string | null;
  createdAt: string;
}

export interface GetAuditHistoryResponse {
  auditLogs: HabitAuditLog[];
  total: number;
}

/**
 * Get audit history for a specific habit
 * US-048, US-052
 */
export const getHabitAuditHistory = async (
  habitId: string,
  limit: number = 50
): Promise<GetAuditHistoryResponse> => {
  const response = await api.get<GetAuditHistoryResponse>(`/habits/${habitId}/audit`, {
    params: { limit },
  });
  return response.data;
};

// ==================== Habit Reactivation (Sprint 6 - US-049, US-053) ====================

export interface ReactivateHabitDTO {
  reason?: string;
}

export interface ReactivateHabitResponse {
  message: string;
  habit: Habit;
}

/**
 * Reactivate a previously deleted habit
 * US-049, US-053
 */
export const reactivateHabit = async (
  habitId: string,
  data?: ReactivateHabitDTO
): Promise<ReactivateHabitResponse> => {
  const response = await api.post<ReactivateHabitResponse>(
    `/habits/${habitId}/reactivate`,
    data || {}
  );
  return response.data;
};

// ==================== Notification Configuration (Sprint 6 - US-051, US-054) ====================

export interface UpdateNotificationConfigDTO {
  enabled: boolean;
  time: string; // HH:mm format
}

export interface NotificationConfig {
  id: string;
  habitId: string;
  userId: string;
  enabled: boolean;
  time: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateNotificationConfigResponse {
  message: string;
  notificationConfig: NotificationConfig;
}

/**
 * Update notification configuration for a habit
 * US-051, US-054
 */
export const updateNotificationConfig = async (
  habitId: string,
  data: UpdateNotificationConfigDTO
): Promise<UpdateNotificationConfigResponse> => {
  const response = await api.put<UpdateNotificationConfigResponse>(
    `/habits/${habitId}/notifications`,
    data
  );
  return response.data;
};
