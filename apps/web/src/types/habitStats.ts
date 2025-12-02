/**
 * Habit Statistics Types
 * Sprint 11 - US-100
 */

export interface StreakData {
  current: number;
  longest: number;
}

export interface CompletionRate {
  overall: number; // Percentage since creation
  last30Days: number;
  last7Days: number;
}

export interface DailyCompletion {
  date: string; // YYYY-MM-DD
  completed: boolean;
  value?: number; // For NUMERIC habits
  targetValue?: number;
}

export interface HabitStats {
  habitId: string;
  habitName: string;
  habitType: 'CHECK' | 'NUMERIC';
  categoryIcon?: string;
  categoryColor?: string;
  unit?: string;
  streaks: StreakData;
  completionRate: CompletionRate;
  dailyCompletions: DailyCompletion[]; // Last 30 days
  calendarData: CalendarDay[];
}

export interface CalendarDay {
  date: string; // YYYY-MM-DD
  status: 'completed' | 'missed' | 'not-scheduled' | 'future';
  value?: number;
  notes?: string;
}
