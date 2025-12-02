/**
 * Streak Service
 * Sprint 4 - US-031, US-035
 *
 * Service for calculating and updating habit streaks (rachas).
 * Implements the streak calculation algorithm considering different periodicities.
 *
 * Performance optimizations (US-035):
 * - Uses denormalized currentStreak, longestStreak, and lastCompletedDate fields
 * - Limits historical queries to last 30 days for efficiency
 * - Leverages database index (habitId, date DESC) for fast lookups
 */

import { prisma } from '../lib/prisma.js';
import { Periodicity } from '../generated/prisma/client.js';
import { NotFoundError } from '../middlewares/error.middleware.js';
import { normalizeToUTCNoon, isSameDay } from '../utils/date.utils.js';

// Alias for backward compatibility within this file
const normalizeDate = normalizeToUTCNoon;

/**
 * Determines if a habit should have been performed on a given date based on its periodicity.
 *
 * @param habit - The habit object with periodicity and weekDays configuration
 * @param date - The date to check
 * @returns true if the habit should have been performed on that date, false otherwise
 */
export function debiaRealizarseEnFecha(
  habit: {
    periodicity: Periodicity;
    weekDays: number[];
    createdAt: Date;
  },
  date: Date
): boolean {
  const normalizedDate = normalizeDate(date);
  const dayOfWeek = normalizedDate.getDay(); // 0 = Sunday, 6 = Saturday

  switch (habit.periodicity) {
    case Periodicity.DAILY:
      // DAILY habits can be done every day or specific days if weekDays is set
      if (habit.weekDays.length > 0) {
        return habit.weekDays.includes(dayOfWeek);
      }
      // If no weekDays specified, it's every day
      return true;

    case Periodicity.WEEKLY:
      // WEEKLY habits must have weekDays configured
      return habit.weekDays.includes(dayOfWeek);

    case Periodicity.MONTHLY: {
      // MONTHLY habits count month-to-month on the same day of month
      // For example, if created on day 15, it should be done on day 15 of each month
      const createdDate = normalizeDate(habit.createdAt);
      return normalizedDate.getDate() === createdDate.getDate();
    }

    case Periodicity.CUSTOM:
      // CUSTOM habits with weekDays specified
      if (habit.weekDays.length > 0) {
        return habit.weekDays.includes(dayOfWeek);
      }
      // If no weekDays, treat like DAILY
      return true;

    default:
      return false;
  }
}

/**
 * Finds the previous date when the habit should have been performed.
 * Goes backwards day by day until finding a date that matches the periodicity.
 *
 * US-035: Optimized to limit search to 30 days for performance.
 * This is sufficient for streak calculation since we cache lastCompletedDate.
 *
 * @param habit - The habit object
 * @param fromDate - The starting date
 * @returns The previous date when habit should have been performed, or null if none found (within 30 days)
 */
function findPreviousScheduledDate(
  habit: {
    periodicity: Periodicity;
    weekDays: number[];
    createdAt: Date;
  },
  fromDate: Date
): Date | null {
  const normalized = normalizeDate(fromDate);
  const createdAt = normalizeDate(habit.createdAt);

  // US-035: Limit to 30 days for performance (down from 365)
  // This is safe because we use cached lastCompletedDate for streak calculation
  const MAX_LOOKBACK_DAYS = 30;

  // Go backwards day by day (max 30 days for performance)
  for (let i = 1; i <= MAX_LOOKBACK_DAYS; i++) {
    const checkDate = new Date(normalized);
    checkDate.setDate(checkDate.getDate() - i);

    // Don't go before habit creation
    if (checkDate < createdAt) {
      return null;
    }

    if (debiaRealizarseEnFecha(habit, checkDate)) {
      return checkDate;
    }
  }

  return null;
}

/**
 * Main streak calculation function.
 * Updates currentStreak and longestStreak for a habit after a record is created/updated.
 *
 * This function implements the algorithm specified in US-031:
 * - If habit completed today AND yesterday (and should have been done): currentStreak++
 * - If habit completed today BUT NOT yesterday (and should have been done): currentStreak = 1
 * - If habit NOT completed today (breaks streak): currentStreak = 0
 * - If currentStreak > longestStreak: update record (longestStreak = currentStreak)
 *
 * Performance optimizations (US-035):
 * - Uses cached lastCompletedDate from Habit model (no need to query HabitRecord)
 * - Only queries HabitRecord when necessary for retroactive marking
 * - Benefits from (habitId, date DESC) index for fast lookups
 *
 * @param habitId - The ID of the habit
 * @param userId - The ID of the user
 * @param date - The date for which the record was created/updated
 * @param completed - Whether the habit was marked as completed
 * @returns Updated habit with new streak values
 */
export async function actualizarRacha(
  habitId: string,
  userId: string,
  date: Date,
  completed: boolean
) {
  const normalizedDate = normalizeDate(date);

  // Fetch habit with necessary fields
  const habit = await prisma.habit.findFirst({
    where: { id: habitId, userId, isActive: true },
    select: {
      id: true,
      periodicity: true,
      weekDays: true,
      createdAt: true,
      currentStreak: true,
      longestStreak: true,
      lastCompletedDate: true,
    },
  });

  if (!habit) {
    throw new NotFoundError('Habit not found');
  }

  let newCurrentStreak = 0;
  let newLongestStreak = habit.longestStreak;
  let newLastCompletedDate = habit.lastCompletedDate;

  if (completed) {
    // Habit was completed on this date
    newLastCompletedDate = normalizedDate;

    // Check if this is the first completion ever
    if (!habit.lastCompletedDate) {
      newCurrentStreak = 1;
    } else {
      const lastCompletedNormalized = normalizeDate(habit.lastCompletedDate);

      // Check if we're updating the same date (re-marking the same day)
      if (isSameDay(normalizedDate, lastCompletedNormalized)) {
        // Same day, keep current streak
        newCurrentStreak = habit.currentStreak;
      }
      // Check if we're marking today and had completed yesterday (or last scheduled day)
      else if (normalizedDate > lastCompletedNormalized) {
        // Find the previous scheduled date from normalizedDate
        const previousScheduledDate = findPreviousScheduledDate(habit, normalizedDate);

        if (previousScheduledDate && isSameDay(previousScheduledDate, lastCompletedNormalized)) {
          // Consecutive completion - increment streak
          newCurrentStreak = habit.currentStreak + 1;
        } else {
          // Gap in streak - restart
          newCurrentStreak = 1;
        }
      }
      // If marking a past date (retroactive marking)
      else {
        // When marking retroactively, we need to recalculate the entire streak
        // This is a complex operation - for now, we'll keep it simple and just set to 1
        // A full implementation would require scanning all records and recalculating
        newCurrentStreak = 1;
      }
    }

    // Update longest streak if current exceeds it
    if (newCurrentStreak > newLongestStreak) {
      newLongestStreak = newCurrentStreak;
    }
  } else {
    // Habit was marked as NOT completed (explicitly uncompleted)
    // This breaks the streak ONLY if it's for today or a recent date
    const today = normalizeDate(new Date());

    if (isSameDay(normalizedDate, today)) {
      // Breaking streak today
      newCurrentStreak = 0;
      // lastCompletedDate remains unchanged (keeps the last time it was completed)
    } else {
      // Retroactively marking as incomplete - need to recalculate streak
      // For now, we'll keep the current streak logic simple
      // A full implementation would require scanning records
      newCurrentStreak = 0;
    }
  }

  // Update habit with new streak values (transactional)
  const updatedHabit = await prisma.habit.update({
    where: { id: habitId },
    data: {
      currentStreak: newCurrentStreak,
      longestStreak: newLongestStreak,
      lastCompletedDate: newLastCompletedDate,
      updatedAt: new Date(),
    },
  });

  return updatedHabit;
}

/**
 * Recalculates the entire streak for a habit from a given date to today.
 * Used for retroactive marking (US-040) to ensure streak is accurate.
 *
 * Algorithm:
 * 1. Fetch all HabitRecords from the retroactive date to today
 * 2. Create a Map of dates that were completed
 * 3. Walk through each day that should have been completed (based on periodicity)
 * 4. Count consecutive completions starting from today going backwards
 * 5. Find the longest streak in the entire history
 * 6. Update habit with new currentStreak and longestStreak
 *
 * @param habitId - The ID of the habit
 * @param userId - The ID of the user
 * @param fromDate - The date from which to recalculate (typically the retroactive date)
 * @returns Updated habit with recalculated streaks
 */
export async function recalcularRachaCompleta(habitId: string, userId: string, fromDate: Date) {
  const normalizedFromDate = normalizeDate(fromDate);
  const today = normalizeDate(new Date());

  // Fetch habit with necessary fields
  const habit = await prisma.habit.findFirst({
    where: { id: habitId, userId, isActive: true },
    select: {
      id: true,
      periodicity: true,
      weekDays: true,
      createdAt: true,
      currentStreak: true,
      longestStreak: true,
      lastCompletedDate: true,
    },
  });

  if (!habit) {
    throw new NotFoundError('Habit not found');
  }

  // Fetch all completed records from the retroactive date to today
  const completedRecords = await prisma.habitRecord.findMany({
    where: {
      habitId,
      userId,
      completed: true,
      date: {
        gte: normalizedFromDate,
        lte: today,
      },
    },
    select: {
      date: true,
    },
    orderBy: {
      date: 'asc',
    },
  });

  // Create a Set of completed dates (as timestamps) for O(1) lookup
  const completedDatesSet = new Set<number>();
  let latestCompletedDate: Date | null = null;

  for (const record of completedRecords) {
    const normalized = normalizeDate(record.date);
    completedDatesSet.add(normalized.getTime());
    if (!latestCompletedDate || normalized > latestCompletedDate) {
      latestCompletedDate = normalized;
    }
  }

  // Calculate currentStreak: Count consecutive completions from today backwards
  let currentStreak = 0;
  let checkDate = new Date(today);
  const habitCreatedAt = normalizeDate(habit.createdAt);

  while (checkDate >= habitCreatedAt && checkDate >= normalizedFromDate) {
    // Check if this date should have been completed based on periodicity
    if (debiaRealizarseEnFecha(habit, checkDate)) {
      // Check if it was actually completed
      if (completedDatesSet.has(checkDate.getTime())) {
        currentStreak++;
      } else {
        // Streak is broken
        break;
      }
    }

    // Move to previous day
    checkDate.setDate(checkDate.getDate() - 1);
  }

  // Calculate longestStreak: Find the longest consecutive sequence in history
  // We need to scan the entire habit history, not just from fromDate
  const allCompletedRecords = await prisma.habitRecord.findMany({
    where: {
      habitId,
      userId,
      completed: true,
    },
    select: {
      date: true,
    },
    orderBy: {
      date: 'asc',
    },
  });

  // Build complete Set of all completed dates
  const allCompletedDatesSet = new Set<number>();
  for (const record of allCompletedRecords) {
    allCompletedDatesSet.add(normalizeDate(record.date).getTime());
  }

  // Walk through entire history to find longest streak
  let longestStreak = 0;
  let tempStreak = 0;
  checkDate = new Date(today);

  while (checkDate >= habitCreatedAt) {
    if (debiaRealizarseEnFecha(habit, checkDate)) {
      if (allCompletedDatesSet.has(checkDate.getTime())) {
        tempStreak++;
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
      } else {
        tempStreak = 0;
      }
    }

    checkDate.setDate(checkDate.getDate() - 1);
  }

  // Update habit with recalculated streaks
  const updatedHabit = await prisma.habit.update({
    where: { id: habitId },
    data: {
      currentStreak,
      longestStreak: Math.max(longestStreak, habit.longestStreak), // Keep the highest ever
      lastCompletedDate: latestCompletedDate,
      updatedAt: new Date(),
    },
  });

  return updatedHabit;
}

export const streakService = {
  actualizarRacha,
  debiaRealizarseEnFecha,
  recalcularRachaCompleta,
};
