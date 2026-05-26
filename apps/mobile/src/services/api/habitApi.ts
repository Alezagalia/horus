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
}

export interface HabitStats {
  today: { total: number; completed: number; percentage: number };
  streaks: { currentBest: number; longestEver: number };
}

export const habitApi = {
  list: async (): Promise<Habit[]> => {
    const { data } = await axiosInstance.get('/habits');
    return data.habits ?? data;
  },

  getStats: async (): Promise<HabitStats> => {
    const { data } = await axiosInstance.get('/habits/stats');
    return data;
  },

  toggleRecord: async (habitId: string, date: string, completed: boolean): Promise<void> => {
    await axiosInstance.post(`/habits/${habitId}/records`, { date, completed });
  },
};
