/**
 * Analytics Types
 * F-07 - Reportes y Tendencias
 * Sprint 15 - US-141
 */

/**
 * Common period descriptor used by all analytics endpoints.
 */
export interface AnalyticsPeriod {
  from: string; // ISO date YYYY-MM-DD
  to: string; // ISO date YYYY-MM-DD
  days: number;
}

// ---------------------------------------------------------------------------
// US-142 — Overview
// ---------------------------------------------------------------------------

export interface AnalyticsOverviewHabits {
  totalCompletions: number;
  uniqueHabitsCompleted: number;
  completionRate: number; // 0..1
  longestStreakInPeriod: number;
}

export interface AnalyticsOverviewTasks {
  completed: number;
  pending: number;
  overdue: number;
  completionRate: number; // 0..1
}

export interface AnalyticsOverviewFinance {
  income: number;
  expense: number;
  net: number;
  transactionCount: number;
}

export interface AnalyticsOverviewWorkouts {
  completed: number;
  totalVolume: number;
}

export interface AnalyticsOverviewGoals {
  active: number;
  completedInPeriod: number;
  averageProgress: number; // 0..1
}

export interface AnalyticsOverview {
  period: AnalyticsPeriod;
  habits: AnalyticsOverviewHabits;
  tasks: AnalyticsOverviewTasks;
  finance: AnalyticsOverviewFinance;
  workouts: AnalyticsOverviewWorkouts;
  goals: AnalyticsOverviewGoals;
}

// ---------------------------------------------------------------------------
// US-143 — Habit heatmap
// ---------------------------------------------------------------------------

export type HabitHeatmapLevel = 0 | 1 | 2 | 3 | 4;

export interface HabitHeatmapDay {
  date: string; // YYYY-MM-DD
  completions: number;
  level: HabitHeatmapLevel;
}

export interface HabitHeatmapBestDay {
  date: string;
  completions: number;
}

export interface HabitHeatmap {
  year: number;
  totalCompletions: number;
  bestDay: HabitHeatmapBestDay | null;
  days: HabitHeatmapDay[]; // always 365 or 366 entries, ascending order
}

// ---------------------------------------------------------------------------
// US-144 — Finance trends
// ---------------------------------------------------------------------------

export interface FinanceTrendCategoryPoint {
  month: string; // YYYY-MM
  amount: number;
}

export interface FinanceTrendCategorySeries {
  categoryId: string;
  categoryName: string;
  color: string | null;
  points: FinanceTrendCategoryPoint[];
}

export interface FinanceTrendsProjection {
  month: string; // YYYY-MM of the current month
  projectedTotal: number;
  daysElapsed: number;
  daysInMonth: number;
}

export interface FinanceTrends {
  months: string[]; // YYYY-MM ascending
  series: FinanceTrendCategorySeries[];
  projection: FinanceTrendsProjection | null;
}

// ---------------------------------------------------------------------------
// US-145 — Productivity
// ---------------------------------------------------------------------------

export type DayOfWeekIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface ProductivityDayOfWeek {
  dayOfWeek: DayOfWeekIndex; // 0 = Sunday
  completed: number;
}

export interface ProductivityHourOfDay {
  hour: number; // 0..23
  completed: number;
}

export interface ProductivityHeatmapCell {
  dayOfWeek: DayOfWeekIndex;
  hour: number;
  completed: number;
}

export interface Productivity {
  period: AnalyticsPeriod;
  totalCompleted: number;
  byDayOfWeek: ProductivityDayOfWeek[]; // exactly 7 entries
  byHourOfDay: ProductivityHourOfDay[]; // only hours with completed > 0
  heatmap: ProductivityHeatmapCell[]; // only cells with completed > 0
  bestDayOfWeek: ProductivityDayOfWeek | null;
  bestHour: ProductivityHourOfDay | null;
}

// ---------------------------------------------------------------------------
// US-146 — Compare periods
// ---------------------------------------------------------------------------

export type ComparableDimension =
  | 'habits.completions'
  | 'tasks.completed'
  | 'finance.expense'
  | 'finance.income'
  | 'workouts.completed';

export const COMPARABLE_DIMENSIONS: readonly ComparableDimension[] = [
  'habits.completions',
  'tasks.completed',
  'finance.expense',
  'finance.income',
  'workouts.completed',
] as const;

export interface ComparisonValue {
  current: number;
  previous: number;
  delta: number; // current - previous
  deltaPercentage: number | null; // null when previous = 0
}

export type ComparisonMetrics = Record<ComparableDimension, ComparisonValue>;

export interface PeriodComparison {
  current: AnalyticsPeriod;
  previous: AnalyticsPeriod;
  metrics: ComparisonMetrics;
}
