/**
 * Stats Service
 * Sprint 5 - US-037
 *
 * Service for calculating user habit statistics
 * Provides aggregated data for dashboard visualizations
 */

import { prisma } from '../lib/prisma.js';
import { Periodicity } from '../generated/prisma/client.js';
import { debiaRealizarseEnFecha } from './streak.service.js';
import { NotFoundError } from '../middlewares/error.middleware.js';

/**
 * Interface for general stats response
 */
export interface GeneralStats {
  completionRateToday: number;
  totalHabitsToday: number;
  completedHabitsToday: number;
  longestCurrentStreak: number;
  habitWithLongestStreak: {
    id: string;
    name: string;
    streak: number;
  } | null;
  last7DaysCompletion: Array<{
    date: string;
    completionRate: number;
  }>;
  statsByCategory: Array<{
    categoryId: string;
    categoryName: string;
    totalHabits: number;
    completionRate: number;
  }>;
}

/**
 * Interface for habit-specific stats response
 * Sprint 5 - US-038
 */
export interface HabitStats {
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
  last30DaysValues?: Array<{
    date: string;
    value: number | null;
  }>;
}

/**
 * Helper function to normalize a date to start of day (00:00:00.000)
 */
function normalizeDate(date: Date): Date {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

/**
 * Get general statistics for a user
 * Includes today's completion rate, streaks, last 7 days, and stats by category
 */
export async function getGeneralStats(userId: string): Promise<GeneralStats> {
  const today = normalizeDate(new Date());

  // Fetch all active habits with their categories and records
  const habits = await prisma.habit.findMany({
    where: {
      userId,
      isActive: true,
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      records: {
        where: {
          date: {
            gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
            lte: today,
          },
        },
        select: {
          date: true,
          completed: true,
        },
      },
    },
  });

  // Calculate today's completion rate
  const todayStats = calculateCompletionRateToday(habits, today);

  // Find longest current streak
  const streakStats = getLongestCurrentStreak(habits);

  // Calculate last 7 days completion
  const last7Days = getLast7DaysCompletion(habits, today);

  // Calculate stats by category
  const categoryStats = getStatsByCategory(habits, today);

  return {
    completionRateToday: todayStats.completionRate,
    totalHabitsToday: todayStats.totalHabitsToday,
    completedHabitsToday: todayStats.completedHabitsToday,
    longestCurrentStreak: streakStats.longestStreak,
    habitWithLongestStreak: streakStats.habitWithLongestStreak,
    last7DaysCompletion: last7Days,
    statsByCategory: categoryStats,
  };
}

/**
 * Calculate completion rate for today
 * Only considers habits that should be performed today based on periodicity
 */
function calculateCompletionRateToday(
  habits: Array<{
    id: string;
    periodicity: Periodicity;
    weekDays: number[];
    createdAt: Date;
    records: Array<{ date: Date; completed: boolean }>;
  }>,
  today: Date
): {
  completionRate: number;
  totalHabitsToday: number;
  completedHabitsToday: number;
} {
  // Filter habits that should be done today
  const habitsForToday = habits.filter((habit) =>
    debiaRealizarseEnFecha(
      {
        periodicity: habit.periodicity,
        weekDays: habit.weekDays,
        createdAt: habit.createdAt,
      },
      today
    )
  );

  const totalHabitsToday = habitsForToday.length;

  if (totalHabitsToday === 0) {
    return {
      completionRate: 0,
      totalHabitsToday: 0,
      completedHabitsToday: 0,
    };
  }

  // Count how many are completed today
  const completedHabitsToday = habitsForToday.filter((habit) => {
    const todayRecord = habit.records.find(
      (record) => normalizeDate(record.date).getTime() === today.getTime()
    );
    return todayRecord?.completed === true;
  }).length;

  const completionRate = Math.round((completedHabitsToday / totalHabitsToday) * 100);

  return {
    completionRate,
    totalHabitsToday,
    completedHabitsToday,
  };
}

/**
 * Find the habit with the longest current streak
 */
function getLongestCurrentStreak(
  habits: Array<{
    id: string;
    name: string;
    currentStreak: number;
  }>
): {
  longestStreak: number;
  habitWithLongestStreak: {
    id: string;
    name: string;
    streak: number;
  } | null;
} {
  if (habits.length === 0) {
    return {
      longestStreak: 0,
      habitWithLongestStreak: null,
    };
  }

  // Find habit with max currentStreak
  const habitWithMaxStreak = habits.reduce((max, habit) =>
    habit.currentStreak > max.currentStreak ? habit : max
  );

  return {
    longestStreak: habitWithMaxStreak.currentStreak,
    habitWithLongestStreak:
      habitWithMaxStreak.currentStreak > 0
        ? {
            id: habitWithMaxStreak.id,
            name: habitWithMaxStreak.name,
            streak: habitWithMaxStreak.currentStreak,
          }
        : null,
  };
}

/**
 * Calculate completion rate for last 7 days
 * Returns array of {date, completionRate} for charting
 */
function getLast7DaysCompletion(
  habits: Array<{
    periodicity: Periodicity;
    weekDays: number[];
    createdAt: Date;
    records: Array<{ date: Date; completed: boolean }>;
  }>,
  today: Date
): Array<{ date: string; completionRate: number }> {
  const result: Array<{ date: string; completionRate: number }> = [];

  // Iterate backwards from today to 6 days ago
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const normalizedDate = normalizeDate(date);

    // Filter habits that should be done on this date
    const habitsForDate = habits.filter((habit) =>
      debiaRealizarseEnFecha(
        {
          periodicity: habit.periodicity,
          weekDays: habit.weekDays,
          createdAt: habit.createdAt,
        },
        normalizedDate
      )
    );

    const totalHabitsForDate = habitsForDate.length;

    if (totalHabitsForDate === 0) {
      result.unshift({
        date: normalizedDate.toISOString().split('T')[0],
        completionRate: 0,
      });
      continue;
    }

    // Count completed habits for this date
    const completedForDate = habitsForDate.filter((habit) => {
      const record = habit.records.find(
        (r) => normalizeDate(r.date).getTime() === normalizedDate.getTime()
      );
      return record?.completed === true;
    }).length;

    const completionRate = Math.round((completedForDate / totalHabitsForDate) * 100);

    result.unshift({
      date: normalizedDate.toISOString().split('T')[0],
      completionRate,
    });
  }

  return result;
}

/**
 * Calculate statistics grouped by category
 * Returns completion rate for each category based on today's habits
 */
function getStatsByCategory(
  habits: Array<{
    periodicity: Periodicity;
    weekDays: number[];
    createdAt: Date;
    category: {
      id: string;
      name: string;
    };
    records: Array<{ date: Date; completed: boolean }>;
  }>,
  today: Date
): Array<{
  categoryId: string;
  categoryName: string;
  totalHabits: number;
  completionRate: number;
}> {
  // Group habits by category
  const categoriesMap = new Map<
    string,
    {
      categoryId: string;
      categoryName: string;
      habits: Array<{
        periodicity: Periodicity;
        weekDays: number[];
        createdAt: Date;
        records: Array<{ date: Date; completed: boolean }>;
      }>;
    }
  >();

  habits.forEach((habit) => {
    const categoryId = habit.category.id;
    if (!categoriesMap.has(categoryId)) {
      categoriesMap.set(categoryId, {
        categoryId,
        categoryName: habit.category.name,
        habits: [],
      });
    }
    categoriesMap.get(categoryId)!.habits.push(habit);
  });

  // Calculate stats for each category
  const result: Array<{
    categoryId: string;
    categoryName: string;
    totalHabits: number;
    completionRate: number;
  }> = [];

  categoriesMap.forEach((category) => {
    // Filter habits that should be done today
    const habitsForToday = category.habits.filter((habit) =>
      debiaRealizarseEnFecha(
        {
          periodicity: habit.periodicity,
          weekDays: habit.weekDays,
          createdAt: habit.createdAt,
        },
        today
      )
    );

    const totalHabits = habitsForToday.length;

    if (totalHabits === 0) {
      result.push({
        categoryId: category.categoryId,
        categoryName: category.categoryName,
        totalHabits: category.habits.length, // Total habits in category, not just today
        completionRate: 0,
      });
      return;
    }

    // Count completed today
    const completedToday = habitsForToday.filter((habit) => {
      const todayRecord = habit.records.find(
        (r) => normalizeDate(r.date).getTime() === today.getTime()
      );
      return todayRecord?.completed === true;
    }).length;

    const completionRate = Math.round((completedToday / totalHabits) * 100);

    result.push({
      categoryId: category.categoryId,
      categoryName: category.categoryName,
      totalHabits: category.habits.length,
      completionRate,
    });
  });

  return result;
}

// ==================== Habit-Specific Stats (US-038) ====================

/**
 * Get detailed statistics for a specific habit
 * Sprint 5 - US-038
 *
 * @param habitId - The ID of the habit
 * @param userId - The ID of the user (for ownership validation)
 * @returns Detailed stats including streaks, completion rates, and value statistics
 */
export async function getHabitStats(habitId: string, userId: string): Promise<HabitStats> {
  const today = normalizeDate(new Date());

  // Fetch habit with all records
  const habit = await prisma.habit.findFirst({
    where: {
      id: habitId,
      userId,
      isActive: true,
    },
    include: {
      records: {
        select: {
          date: true,
          completed: true,
          value: true,
        },
        orderBy: {
          date: 'desc',
        },
      },
    },
  });

  if (!habit) {
    throw new NotFoundError('Habit not found');
  }

  // Calculate total completions
  const totalCompletions = habit.records.filter((r) => r.completed).length;

  // Calculate overall completion rate (considering periodicity)
  const overallRate = calculateOverallCompletionRate(habit, today);

  // Calculate last 30 days rate and data
  const { rate: last30DaysRate, data: last30DaysData } = getLast30DaysData(habit, today);

  // Build base stats
  const stats: HabitStats = {
    currentStreak: habit.currentStreak,
    longestStreak: habit.longestStreak,
    totalCompletions,
    overallCompletionRate: overallRate,
    last30DaysRate,
    last30DaysData,
  };

  // Add NUMERIC-specific stats if applicable
  if (habit.type === 'NUMERIC') {
    const numericStats = calculateNumericStats(habit.records);
    stats.averageValue = numericStats.averageValue;
    stats.minValue = numericStats.minValue;
    stats.maxValue = numericStats.maxValue;
    stats.last30DaysValues = getLast30DaysValues(habit.records, today);
  }

  return stats;
}

/**
 * Calculate overall completion rate since habit creation
 * Only considers days when the habit should have been completed based on periodicity
 */
function calculateOverallCompletionRate(
  habit: {
    periodicity: Periodicity;
    weekDays: number[];
    createdAt: Date;
    records: Array<{ date: Date; completed: boolean }>;
  },
  today: Date
): number {
  const createdDate = normalizeDate(habit.createdAt);
  const normalizedToday = normalizeDate(today);

  // Count how many days the habit should have been completed
  let shouldCompleteDays = 0;
  let completedDays = 0;

  // Create a map of completed dates for quick lookup
  const completedDatesMap = new Map<number, boolean>();
  habit.records.forEach((record) => {
    if (record.completed) {
      completedDatesMap.set(normalizeDate(record.date).getTime(), true);
    }
  });

  // Iterate from creation date to today
  const currentDate = new Date(createdDate);
  while (currentDate <= normalizedToday) {
    if (
      debiaRealizarseEnFecha(
        {
          periodicity: habit.periodicity,
          weekDays: habit.weekDays,
          createdAt: habit.createdAt,
        },
        currentDate
      )
    ) {
      shouldCompleteDays++;
      if (completedDatesMap.has(currentDate.getTime())) {
        completedDays++;
      }
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  if (shouldCompleteDays === 0) {
    return 0;
  }

  return Math.round((completedDays / shouldCompleteDays) * 100);
}

/**
 * Get last 30 days data with completion status and shouldComplete flag
 * Returns both rate and detailed data for charting
 */
function getLast30DaysData(
  habit: {
    periodicity: Periodicity;
    weekDays: number[];
    createdAt: Date;
    type: string;
    records: Array<{ date: Date; completed: boolean; value: number | null }>;
  },
  today: Date
): {
  rate: number;
  data: Array<{
    date: string;
    completed: boolean;
    value: number | null;
    shouldComplete: boolean;
  }>;
} {
  const result: Array<{
    date: string;
    completed: boolean;
    value: number | null;
    shouldComplete: boolean;
  }> = [];

  // Create map of records for quick lookup
  const recordsMap = new Map<number, { completed: boolean; value: number | null }>();
  habit.records.forEach((record) => {
    recordsMap.set(normalizeDate(record.date).getTime(), {
      completed: record.completed,
      value: record.value,
    });
  });

  let shouldCompleteDays = 0;
  let completedDays = 0;

  // Iterate backwards from today to 29 days ago
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const normalizedDate = normalizeDate(date);

    const shouldComplete = debiaRealizarseEnFecha(
      {
        periodicity: habit.periodicity,
        weekDays: habit.weekDays,
        createdAt: habit.createdAt,
      },
      normalizedDate
    );

    const record = recordsMap.get(normalizedDate.getTime());
    const completed = record?.completed || false;
    const value = record?.value || null;

    if (shouldComplete) {
      shouldCompleteDays++;
      if (completed) {
        completedDays++;
      }
    }

    result.push({
      date: normalizedDate.toISOString().split('T')[0],
      completed,
      value,
      shouldComplete,
    });
  }

  const rate = shouldCompleteDays > 0 ? Math.round((completedDays / shouldCompleteDays) * 100) : 0;

  return { rate, data: result };
}

/**
 * Calculate numeric statistics (average, min, max) for NUMERIC habits
 */
function calculateNumericStats(records: Array<{ completed: boolean; value: number | null }>): {
  averageValue: number | null;
  minValue: number | null;
  maxValue: number | null;
} {
  // Filter records that have a value
  const recordsWithValue = records.filter((r) => r.value !== null && r.value !== undefined);

  if (recordsWithValue.length === 0) {
    return {
      averageValue: null,
      minValue: null,
      maxValue: null,
    };
  }

  const values = recordsWithValue.map((r) => r.value as number);

  const sum = values.reduce((acc, val) => acc + val, 0);
  const average = sum / values.length;

  const min = Math.min(...values);
  const max = Math.max(...values);

  return {
    averageValue: Math.round(average * 100) / 100, // Round to 2 decimals
    minValue: min,
    maxValue: max,
  };
}

/**
 * Get last 30 days values for NUMERIC habits (for line charts)
 */
function getLast30DaysValues(
  records: Array<{ date: Date; value: number | null }>,
  today: Date
): Array<{ date: string; value: number | null }> {
  const result: Array<{ date: string; value: number | null }> = [];

  // Create map of records for quick lookup
  const recordsMap = new Map<number, number | null>();
  records.forEach((record) => {
    recordsMap.set(normalizeDate(record.date).getTime(), record.value);
  });

  // Iterate backwards from today to 29 days ago
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const normalizedDate = normalizeDate(date);

    const value = recordsMap.get(normalizedDate.getTime()) || null;

    result.push({
      date: normalizedDate.toISOString().split('T')[0],
      value,
    });
  }

  return result;
}

export const statsService = {
  getGeneralStats,
  getHabitStats,
};
