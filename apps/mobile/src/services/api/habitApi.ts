import { axiosInstance } from '../axios';

export interface HabitCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface Habit {
  id: string;
  name: string;
  description?: string;
  type: 'CHECK' | 'NUMERIC';
  targetValue?: number;
  unit?: string;
  periodicity: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';
  weekDays: number[];
  timeOfDay: string;
  color?: string;
  isActive: boolean;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate?: string;
  category?: HabitCategory;
  /** Registro del día consultado (solo presente si se pidió list(date)). */
  records?: HabitRecord[];
}

export interface HabitRecord {
  id: string;
  habitId: string;
  completed: boolean;
  value: number | null;
  notes: string | null;
}

export interface CreateHabitDTO {
  categoryId: string;
  name: string;
  description?: string;
  type: 'CHECK' | 'NUMERIC';
  targetValue?: number;
  unit?: string;
  periodicity: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';
  weekDays: number[];
  timeOfDay: string;
  color?: string;
}

export interface UpdateHabitDTO extends Partial<CreateHabitDTO> {}

export interface HabitStats {
  today: { total: number; completed: number; percentage: number };
  streaks: { currentBest: number; longestEver: number };
}

export interface HabitDetailedStats {
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
  last30DaysValues?: Array<{ date: string; value: number | null }>;
}

// Offline-first Fase 2: los hábitos se leen/escriben en WatermelonDB
// (src/db/habitQueries|habitWrites) y se replican vía /api/replication.
// Solo quedan acá los tipos que consume la UI y las stats detalladas
// (heatmap/tasas del modal habit-stats), que las calcula el server.
export const habitApi = {
  getDetailedStats: async (id: string): Promise<HabitDetailedStats> => {
    const { data } = await axiosInstance.get(`/habits/${id}/stats`);
    return data;
  },
};
