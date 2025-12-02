/**
 * Dashboard Types
 * Sprint 11 - US-097
 */

export interface HabitSummary {
  id: string;
  name: string;
  completed: boolean;
  categoryIcon?: string;
  categoryColor?: string;
  currentStreak: number;
}

export interface TaskSummary {
  id: string;
  title: string;
  completed: boolean;
  priority: 'alta' | 'media' | 'baja';
  dueDate: string;
}

export interface DashboardStats {
  activeHabits: number;
  pendingTasks: number;
  overdueTasks: number;
}

export interface BestStreak {
  habitName: string;
  streakDays: number;
}

export interface DashboardData {
  todayHabits: HabitSummary[];
  upcomingTasks: TaskSummary[];
  stats: DashboardStats;
  bestStreak: BestStreak | null;
  habitsCompletionPercentage: number;
}
