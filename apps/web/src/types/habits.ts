/**
 * Habits Types
 * Sprint 11 - US-098, US-099
 */

export type HabitType = 'CHECK' | 'NUMERIC';
export type TimeOfDay = string;
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
  order: number;
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

export type HabitsGrouped = Record<string, HabitOfDay[]>;

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
