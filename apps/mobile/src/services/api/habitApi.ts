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

export interface CreateHabitDTO {
  categoryId: string;
  name: string;
  description?: string;
  type: 'CHECK' | 'NUMERIC';
  targetValue?: number;
  unit?: string;
  periodicity: 'DAILY' | 'WEEKLY' | 'MONTHLY';
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

interface GeneralStatsResponse {
  completionRateToday: number;
  totalHabitsToday: number;
  completedHabitsToday: number;
  longestCurrentStreak: number;
  habitWithLongestStreak: { id: string; name: string; streak: number } | null;
}

export const habitApi = {
  list: async (): Promise<Habit[]> => {
    const { data } = await axiosInstance.get('/habits');
    return data.habits ?? data;
  },

  getStats: async (): Promise<HabitStats> => {
    const { data }: { data: GeneralStatsResponse } = await axiosInstance.get('/habits/stats');
    return {
      today: {
        total: data.totalHabitsToday,
        completed: data.completedHabitsToday,
        percentage: data.completionRateToday / 100,
      },
      streaks: {
        currentBest: data.longestCurrentStreak,
        longestEver: data.habitWithLongestStreak?.streak ?? data.longestCurrentStreak,
      },
    };
  },

  toggleRecord: async (habitId: string, date: string, completed: boolean): Promise<void> => {
    await axiosInstance.post(`/habits/${habitId}/records`, { date, completed });
  },

  create: async (dto: CreateHabitDTO): Promise<Habit> => {
    const { data } = await axiosInstance.post('/habits', dto);
    return data.habit ?? data;
  },

  update: async (id: string, dto: UpdateHabitDTO): Promise<Habit> => {
    const { data } = await axiosInstance.put(`/habits/${id}`, dto);
    return data.habit ?? data;
  },

  remove: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/habits/${id}`);
  },

  updateNumericProgress: async (habitId: string, date: string, value: number): Promise<void> => {
    await axiosInstance.post(`/habits/${habitId}/records`, { date, completed: true, value });
  },

  getDetailedStats: async (id: string): Promise<HabitDetailedStats> => {
    const { data } = await axiosInstance.get(`/habits/${id}/stats`);
    return data;
  },
};
