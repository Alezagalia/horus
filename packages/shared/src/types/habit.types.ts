/**
 * Habit Types - Shared across Backend, Mobile, and Web
 * Sprint 3 - US-026 (TECH-001)
 */

/**
 * Habit Type Enum
 */
export enum HabitType {
  CHECK = 'CHECK',
  NUMERIC = 'NUMERIC',
}

/**
 * Periodicity Enum
 */
export enum Periodicity {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  CUSTOM = 'CUSTOM',
}

/**
 * Time of Day Enum
 */
export enum TimeOfDay {
  AYUNO = 'AYUNO',
  MANANA = 'MANANA',
  MEDIA_MANANA = 'MEDIA_MANANA',
  TARDE = 'TARDE',
  MEDIA_TARDE = 'MEDIA_TARDE',
  NOCHE = 'NOCHE',
  ANTES_DORMIR = 'ANTES_DORMIR',
  ANYTIME = 'ANYTIME',
}

/**
 * Habit Category (minimal, embedded in Habit response)
 */
export interface HabitCategory {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  scope: string;
}

/**
 * Habit Entity (full habit object)
 */
export interface Habit {
  id: string;
  userId: string;
  categoryId: string;
  name: string;
  description?: string;
  type: HabitType;
  targetValue?: number;
  unit?: string;
  periodicity: Periodicity;
  weekDays: number[];
  timeOfDay: TimeOfDay;
  reminderTime?: string;
  color?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category: HabitCategory;
}

/**
 * Create Habit DTO
 */
export interface CreateHabitDTO {
  categoryId: string;
  name: string;
  description?: string;
  type: HabitType;
  targetValue?: number;
  unit?: string;
  periodicity?: Periodicity;
  weekDays?: number[];
  timeOfDay?: TimeOfDay;
  reminderTime?: string;
  color?: string;
  order?: number;
  isActive?: boolean;
}

/**
 * Update Habit DTO
 */
export interface UpdateHabitDTO {
  categoryId?: string;
  name?: string;
  description?: string;
  type?: HabitType;
  targetValue?: number;
  unit?: string;
  periodicity?: Periodicity;
  weekDays?: number[];
  timeOfDay?: TimeOfDay;
  reminderTime?: string;
  color?: string;
  order?: number;
  isActive?: boolean;
}

/**
 * Habits Query Filters
 */
export interface HabitsFilters {
  categoryId?: string;
}

/**
 * Labels for enums (for UI display)
 */
export const HABIT_TYPE_LABELS: Record<HabitType, string> = {
  [HabitType.CHECK]: 'Sí/No',
  [HabitType.NUMERIC]: 'Numérico',
};

export const PERIODICITY_LABELS: Record<Periodicity, string> = {
  [Periodicity.DAILY]: 'Diaria',
  [Periodicity.WEEKLY]: 'Semanal',
  [Periodicity.MONTHLY]: 'Mensual',
  [Periodicity.CUSTOM]: 'Personalizada',
};

export const TIME_OF_DAY_LABELS: Record<TimeOfDay, string> = {
  [TimeOfDay.AYUNO]: 'En ayuno',
  [TimeOfDay.MANANA]: 'Mañana',
  [TimeOfDay.MEDIA_MANANA]: 'Media mañana',
  [TimeOfDay.TARDE]: 'Tarde',
  [TimeOfDay.MEDIA_TARDE]: 'Media tarde',
  [TimeOfDay.NOCHE]: 'Noche',
  [TimeOfDay.ANTES_DORMIR]: 'Antes de dormir',
  [TimeOfDay.ANYTIME]: 'Cualquier momento',
};

/**
 * Icons for time of day (for UI display)
 */
export const TIME_OF_DAY_ICONS: Record<TimeOfDay, string> = {
  [TimeOfDay.AYUNO]: '🍽️',
  [TimeOfDay.MANANA]: '🌅',
  [TimeOfDay.MEDIA_MANANA]: '☕',
  [TimeOfDay.TARDE]: '☀️',
  [TimeOfDay.MEDIA_TARDE]: '🍵',
  [TimeOfDay.NOCHE]: '🌙',
  [TimeOfDay.ANTES_DORMIR]: '🛏️',
  [TimeOfDay.ANYTIME]: '⏰',
};

/**
 * Weekdays array (0 = Sunday, 6 = Saturday)
 */
export const WEEKDAY_LABELS: Record<number, string> = {
  0: 'Dom',
  1: 'Lun',
  2: 'Mar',
  3: 'Mié',
  4: 'Jue',
  5: 'Vie',
  6: 'Sáb',
};
