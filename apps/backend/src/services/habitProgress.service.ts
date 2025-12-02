/**
 * HabitProgress Service
 * Sprint 4 - US-032
 *
 * Service for managing incremental progress updates for NUMERIC habits.
 * Allows users to update habit value incrementally during the day.
 */

import { prisma } from '../lib/prisma.js';
import { NotFoundError, BadRequestError } from '../middlewares/error.middleware.js';
import { actualizarRacha } from './streak.service.js';
import { normalizeToUTCNoon } from '../utils/date.utils.js';

/**
 * Updates the progress of a NUMERIC habit incrementally.
 *
 * - Validates that the habit is NUMERIC type
 * - Validates that increment doesn't make value negative
 * - Validates that increment doesn't exceed targetValue (if defined)
 * - Auto-completes habit when value reaches or exceeds targetValue
 * - Updates streak calculation when auto-completed
 * - Creates HabitRecord if doesn't exist for the date
 *
 * @param habitId - The ID of the habit
 * @param userId - The ID of the user
 * @param date - The date for the progress update
 * @param increment - The value to add (positive) or subtract (negative)
 * @returns Updated habit record with progress information
 */
export async function updateHabitProgress(
  habitId: string,
  userId: string,
  date: Date,
  increment: number
) {
  // Normalize date to noon UTC to avoid timezone issues with DATE type
  const normalizedDate = normalizeToUTCNoon(date);

  // Use transaction to ensure atomicity
  const result = await prisma.$transaction(async (tx) => {
    // 1. Verify habit exists and belongs to user
    const habit = await tx.habit.findFirst({
      where: { id: habitId, userId, isActive: true },
    });

    if (!habit) {
      throw new NotFoundError('Habit not found');
    }

    // 2. Validate habit is NUMERIC type
    if (habit.type !== 'NUMERIC') {
      throw new BadRequestError('Progress updates are only available for NUMERIC habits');
    }

    // 3. Get or create the HabitRecord for this date
    const record = await tx.habitRecord.findUnique({
      where: {
        habitId_userId_date: {
          habitId,
          userId,
          date: normalizedDate,
        },
      },
    });

    const currentValue = record?.value ?? 0;
    const newValue = currentValue + increment;

    // 4. Validate new value is not negative
    if (newValue < 0) {
      throw new BadRequestError(
        `Cannot decrease value below 0. Current value: ${currentValue}, increment: ${increment}`
      );
    }

    // 5. Validate new value doesn't exceed targetValue (if defined)
    // Note: We allow equaling the target (that's when it auto-completes)
    // We also allow exceeding for flexibility, but warn in validation
    if (habit.targetValue && newValue > habit.targetValue) {
      // Allow exceeding but could add warning in future
      // For now, we allow it (user might overshoot their goal)
    }

    // 6. Determine if habit should be marked as completed
    // Auto-complete if value >= targetValue (when targetValue is defined)
    const shouldComplete = habit.targetValue ? newValue >= habit.targetValue : false;

    // Note: If targetValue is not defined, we don't auto-complete
    // User must manually mark as completed

    // 7. Upsert the record with new value
    const updatedRecord = await tx.habitRecord.upsert({
      where: {
        habitId_userId_date: {
          habitId,
          userId,
          date: normalizedDate,
        },
      },
      update: {
        value: newValue,
        completed: shouldComplete || (record?.completed ?? false),
        updatedAt: new Date(),
      },
      create: {
        habitId,
        userId,
        date: normalizedDate,
        value: newValue,
        completed: shouldComplete,
      },
      include: {
        habit: {
          select: {
            id: true,
            name: true,
            type: true,
            targetValue: true,
            unit: true,
            currentStreak: true,
            longestStreak: true,
          },
        },
      },
    });

    // 8. If auto-completed, update streak
    // Only update streak if it wasn't already completed and now it is
    const wasCompleted = record?.completed ?? false;
    const isNowCompleted = updatedRecord.completed;

    if (!wasCompleted && isNowCompleted) {
      // Just became completed, update streak
      await actualizarRacha(habitId, userId, normalizedDate, true);
    }

    // 9. Fetch final record with updated streak values
    const finalRecord = await tx.habitRecord.findUnique({
      where: {
        habitId_userId_date: {
          habitId,
          userId,
          date: normalizedDate,
        },
      },
      include: {
        habit: {
          select: {
            id: true,
            name: true,
            type: true,
            targetValue: true,
            unit: true,
            currentStreak: true,
            longestStreak: true,
          },
        },
      },
    });

    // 10. Calculate progress percentage
    const progressPercentage = habit.targetValue
      ? Math.min(100, Math.round((newValue / habit.targetValue) * 100))
      : null;

    return {
      record: finalRecord!,
      progressPercentage,
      autoCompleted: !wasCompleted && isNowCompleted,
    };
  });

  return result;
}

export const habitProgressService = {
  updateHabitProgress,
};
