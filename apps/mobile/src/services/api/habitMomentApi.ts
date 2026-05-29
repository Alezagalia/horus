import { axiosInstance } from '../axios';

export interface HabitMoment {
  id: string;
  key: string;
  label: string;
  emoji: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  sortOrder: number;
  isActive: boolean;
}

export const habitMomentApi = {
  list: async (): Promise<HabitMoment[]> => {
    const { data } = await axiosInstance.get('/habit-moments');
    return data.moments ?? [];
  },
};
