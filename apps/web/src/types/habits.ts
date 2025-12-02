/**
 * Habits Types
 * Sprint 11 - US-098, US-099
 */

export type HabitType = 'CHECK' | 'NUMERIC';
export type TimeOfDay = 'AYUNO' | 'MANANA' | 'MEDIA_MANANA' | 'TARDE' | 'MEDIA_TARDE' | 'NOCHE' | 'ANTES_DORMIR' | 'ANYTIME';
export type Periodicity = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';

export interface HabitOfDay {
  id: string;
  name: string;
  description?: string;
  type: HabitType;
  targetValue?: number;
  unit?: string;
  timeOfDay: TimeOfDay;
  categoryIcon?: string;
  categoryColor?: string;
  currentStreak: number;
  completed: boolean;
  value?: number;
  notes?: string;
}

export interface Habit {
  id: string;
  name: string;
  description?: string;
  type: HabitType;
  targetValue?: number;
  unit?: string;
  periodicity: Periodicity;
  weekDays?: number[]; // For WEEKLY: [1,3,5] = Mon, Wed, Fri
  timeOfDay: TimeOfDay;
  categoryId: string;
  categoryName: string;
  categoryIcon?: string;
  categoryColor?: string;
  color?: string;
  currentStreak: number;
  longestStreak: number;
  isActive: boolean;
  createdAt: string;
}

export interface HabitsGrouped {
  AYUNO: HabitOfDay[];
  MANANA: HabitOfDay[];
  MEDIA_MANANA: HabitOfDay[];
  TARDE: HabitOfDay[];
  MEDIA_TARDE: HabitOfDay[];
  NOCHE: HabitOfDay[];
  ANTES_DORMIR: HabitOfDay[];
  ANYTIME: HabitOfDay[];
}

export interface DayProgress {
  completed: number;
  total: number;
  percentage: number;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
}

export interface HabitFormData {
  name: string;
  description?: string;
  categoryId: string;
  type: HabitType;
  targetValue?: number;
  unit?: string;
  periodicity: Periodicity;
  weekDays?: number[];
  timeOfDay: TimeOfDay;
  color?: string;
}
