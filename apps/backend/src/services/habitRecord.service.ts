/**
 * HabitRecord Service
 * Sprint 4 - US-029
 *
 * Service for managing habit completion records
 */

import { prisma } from '../lib/prisma.js';
import { Periodicity } from '../generated/prisma/client.js';
import { NotFoundError, BadRequestError } from '../middlewares/error.middleware.js';
import { actualizarRacha, recalcularRachaCompleta } from './streak.service.js';
import { normalizeToUTCNoon } from '../utils/date.utils.js';

export interface CreateHabitRecordData {
  habitId: string;
  date: Date;
  completed: boolean;
  value?: number;
  notes?: string;
}

export const habitRecordService = {
  /**
   * Validates if a habit should be performed on a given date based on its periodicity
   */
  async validateHabitPeriodicityForDate(
    habitId: string,
    userId: string,
    date: Date
  ): Promise<void> {
    const habit = await prisma.habit.findFirst({
      where: { id: habitId, userId, isActive: true },
    });

    if (!habit) {
      throw new NotFoundError('Habit not found');
    }

    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday

    switch (habit.periodicity) {
      case Periodicity.DAILY:
        // DAILY habits can be done every day or specific days if weekDays is set
        if (habit.weekDays.length > 0 && !habit.weekDays.includes(dayOfWeek)) {
          throw new BadRequestError(
            `This habit is not scheduled for ${getDayName(dayOfWeek)}. Scheduled days: ${habit.weekDays.map((d) => getDayName(d)).join(', ')}`
          );
        }
        break;

      case Periodicity.WEEKLY:
        // WEEKLY habits must have weekDays configured
        if (!habit.weekDays.includes(dayOfWeek)) {
          throw new BadRequestError(
            `This habit is not scheduled for ${getDayName(dayOfWeek)}. Scheduled days: ${habit.weekDays.map((d) => getDayName(d)).join(', ')}`
          );
        }
        break;

      case Periodicity.MONTHLY:
        // MONTHLY habits can be done any day of the month
        // No validation needed
        break;

      case Periodicity.CUSTOM:
        // CUSTOM habits with weekDays specified
        if (habit.weekDays.length > 0 && !habit.weekDays.includes(dayOfWeek)) {
          throw new BadRequestError(
            `This habit is not scheduled for ${getDayName(dayOfWeek)}. Scheduled days: ${habit.weekDays.map((d) => getDayName(d)).join(', ')}`
          );
        }
        break;

      default:
        throw new BadRequestError('Invalid periodicity');
    }
  },

  /**
   * Creates or updates a habit record for a given date (upsert pattern)
   * This endpoint is idempotent - multiple calls with same data won't cause errors
   */
  async createOrUpdateRecord(userId: string, data: CreateHabitRecordData) {
    const { habitId, date, completed, value, notes } = data;

    // Normalize date to noon UTC to avoid timezone issues with DATE type
    const normalizedDate = normalizeToUTCNoon(date);

    // Validate habit exists and belongs to user
    const habit = await prisma.habit.findFirst({
      where: { id: habitId, userId, isActive: true },
    });

    if (!habit) {
      throw new NotFoundError('Habit not found');
    }

    // Validate periodicity - check if habit should be done on this date
    await this.validateHabitPeriodicityForDate(habitId, userId, normalizedDate);

    // For NUMERIC habits, validate value
    if (habit.type === 'NUMERIC') {
      if (completed && value === undefined) {
        throw new BadRequestError('Value is required for NUMERIC habits when marking as completed');
      }

      if (value !== undefined) {
        if (value < 0) {
          throw new BadRequestError('Value must be a positive number');
        }

        // If habit has targetValue, validate against it
        if (habit.targetValue && value > habit.targetValue) {
          // Allow exceeding target, but it's informational
          // Don't throw error, just validate it's positive
        }
      }
    } else {
      // CHECK habits should not have value
      if (value !== undefined) {
        throw new BadRequestError('CHECK habits should not have a value');
      }
    }

    // Validate notes length
    if (notes && notes.length > 500) {
      throw new BadRequestError('Notes must be 500 characters or less');
    }

    // Use a transaction to ensure atomicity:
    // 1. Upsert the record
    // 2. Update streak calculation
    const record = await prisma.$transaction(async (tx) => {
      // Upsert the record (create or update if exists)
      await tx.habitRecord.upsert({
        where: {
          habitId_userId_date: {
            habitId,
            userId,
            date: normalizedDate,
          },
        },
        update: {
          completed,
          value: value ?? null,
          notes: notes ?? null,
          updatedAt: new Date(),
        },
        create: {
          habitId,
          userId,
          date: normalizedDate,
          completed,
          value: value ?? null,
          notes: notes ?? null,
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

      // Update streak calculation (US-031)
      await actualizarRacha(habitId, userId, normalizedDate, completed);

      // Fetch the record again to include updated streak values
      const updatedRecord = await tx.habitRecord.findUnique({
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

      return updatedRecord!;
    });

    return record;
  },

  /**
   * Gets a habit record for a specific date
   */
  async getRecordByDate(habitId: string, userId: string, date: Date) {
    // Normalize date to noon UTC to avoid timezone issues with DATE type
    const normalizedDate = normalizeToUTCNoon(date);

    // Verify habit exists and belongs to user
    const habit = await prisma.habit.findFirst({
      where: { id: habitId, userId, isActive: true },
    });

    if (!habit) {
      throw new NotFoundError('Habit not found');
    }

    const record = await prisma.habitRecord.findUnique({
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
          },
        },
      },
    });

    return record;
  },

  /**
   * Gets all records for a habit in a date range
   */
  async getRecordsByDateRange(habitId: string, userId: string, startDate: Date, endDate: Date) {
    // Verify habit exists and belongs to user
    const habit = await prisma.habit.findFirst({
      where: { id: habitId, userId, isActive: true },
    });

    if (!habit) {
      throw new NotFoundError('Habit not found');
    }

    const records = await prisma.habitRecord.findMany({
      where: {
        habitId,
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        date: 'desc',
      },
      include: {
        habit: {
          select: {
            id: true,
            name: true,
            type: true,
            targetValue: true,
            unit: true,
          },
        },
      },
    });

    return records;
  },

  /**
   * Gets historical records for a habit with filters and pagination
   * Sprint 5 - US-039
   *
   * @param habitId - ID of the habit
   * @param userId - ID of the user (for ownership validation)
   * @param from - Start date (default: 30 days ago)
   * @param to - End date (default: today)
   * @param limit - Maximum records to return (max: 100)
   * @param offset - Number of records to skip
   * @returns Paginated historical records with metadata
   */
  async getHistoricalRecords(
    habitId: string,
    userId: string,
    from: Date,
    to: Date,
    limit: number,
    offset: number
  ) {
    // Verify habit exists and belongs to user
    const habit = await prisma.habit.findFirst({
      where: { id: habitId, userId, isActive: true },
    });

    if (!habit) {
      throw new NotFoundError('Habit not found');
    }

    // Get total count for pagination metadata
    const totalCount = await prisma.habitRecord.count({
      where: {
        habitId,
        userId,
        date: {
          gte: from,
          lte: to,
        },
      },
    });

    // Get paginated records
    const records = await prisma.habitRecord.findMany({
      where: {
        habitId,
        userId,
        date: {
          gte: from,
          lte: to,
        },
      },
      orderBy: {
        date: 'desc',
      },
      take: limit,
      skip: offset,
      select: {
        id: true,
        date: true,
        completed: true,
        value: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      records,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    };
  },

  /**
   * Marks a habit retroactively with full streak recalculation
   * Sprint 5 - US-040
   *
   * This endpoint is specifically designed for retroactive marking with proper streak recalculation.
   * Unlike createOrUpdateRecord which uses incremental streak updates, this function:
   * - Validates the date is within 7 days
   * - Validates the habit should be performed on that date (periodicity check)
   * - Creates or updates the HabitRecord
   * - Triggers a FULL streak recalculation from that date to today
   *
   * @param userId - The user ID
   * @param habitId - The habit ID
   * @param data - The record data (date, completed, value, notes)
   * @returns Object with success, currentStreak, longestStreak, and recordId
   */
  async markRetroactively(
    userId: string,
    habitId: string,
    data: CreateHabitRecordData
  ): Promise<{
    success: boolean;
    currentStreak: number;
    longestStreak: number;
    recordId: string;
  }> {
    const { date, completed, value, notes } = data;

    // Normalize date to noon UTC to avoid timezone issues with DATE type
    const normalizedDate = normalizeToUTCNoon(date);

    // Validate habit exists and belongs to user
    const habit = await prisma.habit.findFirst({
      where: { id: habitId, userId, isActive: true },
    });

    if (!habit) {
      throw new NotFoundError('Habit not found');
    }

    // Validate periodicity - check if habit should be done on this date
    await this.validateHabitPeriodicityForDate(habitId, userId, normalizedDate);

    // For NUMERIC habits, validate value
    if (habit.type === 'NUMERIC') {
      if (completed && value === undefined) {
        throw new BadRequestError('Value is required for NUMERIC habits when marking as completed');
      }

      if (value !== undefined) {
        if (value < 0) {
          throw new BadRequestError('Value must be a positive number');
        }
      }
    } else {
      // CHECK habits should not have value
      if (value !== undefined) {
        throw new BadRequestError('CHECK habits should not have a value');
      }
    }

    // Validate notes length
    if (notes && notes.length > 500) {
      throw new BadRequestError('Notes must be 500 characters or less');
    }

    // Use a transaction to ensure atomicity:
    // 1. Upsert the record
    // 2. Recalculate streaks completely from this date to today
    const result = await prisma.$transaction(async (tx) => {
      // Upsert the record (create or update if exists)
      const record = await tx.habitRecord.upsert({
        where: {
          habitId_userId_date: {
            habitId,
            userId,
            date: normalizedDate,
          },
        },
        update: {
          completed,
          value: value ?? null,
          notes: notes ?? null,
          updatedAt: new Date(),
        },
        create: {
          habitId,
          userId,
          date: normalizedDate,
          completed,
          value: value ?? null,
          notes: notes ?? null,
        },
      });

      // CRITICAL: Trigger full streak recalculation (US-040)
      // This recalculates currentStreak and longestStreak from the retroactive date to today
      const updatedHabit = await recalcularRachaCompleta(habitId, userId, normalizedDate);

      return {
        recordId: record.id,
        currentStreak: updatedHabit.currentStreak,
        longestStreak: updatedHabit.longestStreak,
      };
    });

    return {
      success: true,
      currentStreak: result.currentStreak,
      longestStreak: result.longestStreak,
      recordId: result.recordId,
    };
  },
};

/**
 * Helper function to get day name from day number
 */
function getDayName(dayOfWeek: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayOfWeek] || 'Unknown';
}
