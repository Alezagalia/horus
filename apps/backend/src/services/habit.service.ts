/**
 * Habit Service
 * Sprint 3 - US-021
 * Sprint 6 - US-047 (Automatic Change Tracking), US-049 (Reactivation)
 */

import { prisma } from '../lib/prisma.js';
import { HabitType, Periodicity, TimeOfDay } from '../generated/prisma/client.js';
import { NotFoundError, BadRequestError } from '../middlewares/error.middleware.js';

export interface CreateHabitData {
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
}

export interface UpdateHabitData {
  categoryId?: string;
  name?: string;
  description?: string | null;
  type?: HabitType;
  targetValue?: number | null;
  unit?: string | null;
  periodicity?: Periodicity;
  weekDays?: number[];
  timeOfDay?: TimeOfDay;
  reminderTime?: string | null;
  color?: string | null;
  order?: number;
}

export const habitService = {
  async findAll(userId: string, categoryId?: string) {
    const where: { userId: string; isActive: boolean; categoryId?: string } = {
      userId,
      isActive: true,
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    return prisma.habit.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true,
            scope: true,
          },
        },
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });
  },

  async findById(id: string, userId: string) {
    const habit = await prisma.habit.findFirst({
      where: { id, userId, isActive: true },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true,
            scope: true,
          },
        },
      },
    });

    if (!habit) {
      throw new NotFoundError('Habit not found');
    }

    return habit;
  },

  async create(userId: string, data: CreateHabitData) {
    // Verify category exists and belongs to user
    const category = await prisma.category.findFirst({
      where: {
        id: data.categoryId,
        userId,
        isActive: true,
      },
    });

    if (!category) {
      throw new NotFoundError('Category not found or does not belong to user');
    }

    // Create habit and audit log in a transaction (US-047)
    const habit = await prisma.$transaction(async (tx) => {
      const newHabit = await tx.habit.create({
        data: {
          ...data,
          userId,
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              icon: true,
              color: true,
              scope: true,
            },
          },
        },
      });

      // Create audit log for habit creation
      await tx.habitAudit.create({
        data: {
          habitId: newHabit.id,
          userId,
          changeType: 'CREATED',
          newValue: JSON.stringify(data),
        },
      });

      return newHabit;
    });

    return habit;
  },

  async update(id: string, userId: string, data: UpdateHabitData) {
    // Verify habit exists and belongs to user
    const oldHabit = await this.findById(id, userId);

    // If updating categoryId, verify new category exists and belongs to user
    if (data.categoryId) {
      const category = await prisma.category.findFirst({
        where: {
          id: data.categoryId,
          userId,
          isActive: true,
        },
      });

      if (!category) {
        throw new NotFoundError('Category not found or does not belong to user');
      }
    }

    // Update habit and create audit logs in a transaction (US-047)
    const updatedHabit = await prisma.$transaction(async (tx) => {
      const updated = await tx.habit.update({
        where: { id },
        data,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              icon: true,
              color: true,
              scope: true,
            },
          },
        },
      });

      // Detect and log changes (US-047)
      const auditedFields = [
        'name',
        'description',
        'periodicity',
        'weekDays',
        'timeOfDay',
        'color',
        'targetValue',
        'unit',
        'categoryId',
      ];

      const auditLogs: Array<{
        habitId: string;
        userId: string;
        changeType: 'UPDATED';
        fieldChanged: string;
        oldValue: string;
        newValue: string;
      }> = [];

      for (const field of auditedFields) {
        const oldValue = oldHabit[field as keyof typeof oldHabit];
        const newValue = data[field as keyof typeof data];

        // Skip if field was not updated or value didn't change
        if (newValue === undefined || JSON.stringify(oldValue) === JSON.stringify(newValue)) {
          continue;
        }

        auditLogs.push({
          habitId: id,
          userId,
          changeType: 'UPDATED',
          fieldChanged: field,
          oldValue: JSON.stringify(oldValue),
          newValue: JSON.stringify(newValue),
        });
      }

      // Create all audit logs
      if (auditLogs.length > 0) {
        await tx.habitAudit.createMany({
          data: auditLogs,
        });
      }

      return updated;
    });

    return updatedHabit;
  },

  async delete(id: string, userId: string) {
    // Verify habit exists and belongs to user
    await this.findById(id, userId);

    // Soft delete and create audit log in a transaction (US-047)
    return prisma.$transaction(async (tx) => {
      const deleted = await tx.habit.update({
        where: { id },
        data: { isActive: false },
      });

      // Create audit log for deletion
      await tx.habitAudit.create({
        data: {
          habitId: id,
          userId,
          changeType: 'DELETED',
          reason: 'User requested habit deletion',
        },
      });

      return deleted;
    });
  },

  /**
   * Reorders habits within a specific time of day
   * Sprint 13
   *
   * Updates the order field for each habit based on the provided array order
   */
  async reorderHabits(userId: string, timeOfDay: TimeOfDay, habitIds: string[]) {
    // Verify all habits belong to user and have the specified timeOfDay
    const habits = await prisma.habit.findMany({
      where: {
        id: { in: habitIds },
        userId,
        isActive: true,
        timeOfDay,
      },
      select: { id: true },
    });

    const foundIds = new Set(habits.map((h) => h.id));
    const invalidIds = habitIds.filter((id) => !foundIds.has(id));

    if (invalidIds.length > 0) {
      throw new BadRequestError(
        `Some habits were not found or don't belong to the specified time of day: ${invalidIds.join(', ')}`
      );
    }

    // Update order for each habit in a transaction
    await prisma.$transaction(
      habitIds.map((id, index) =>
        prisma.habit.update({
          where: { id },
          data: { order: index },
        })
      )
    );

    return { success: true, reorderedCount: habitIds.length };
  },

  /**
   * Reactivates a previously deleted habit
   * Sprint 6 - US-049
   *
   * Sets isActive = true, resets currentStreak = 0, maintains longestStreak
   * Creates audit log with REACTIVATED changeType
   */
  async reactivate(id: string, userId: string, reason?: string) {
    // Get habit with all data (including inactive ones)
    const habit = await prisma.habit.findFirst({
      where: { id, userId },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true,
            scope: true,
          },
        },
      },
    });

    if (!habit) {
      throw new NotFoundError('Habit not found');
    }

    // Validate habit is currently inactive
    if (habit.isActive) {
      throw new BadRequestError('Habit is already active');
    }

    // Reactivate habit and create audit log in a transaction (US-049)
    return prisma.$transaction(async (tx) => {
      const reactivated = await tx.habit.update({
        where: { id },
        data: {
          isActive: true,
          currentStreak: 0, // Reset current streak (start fresh)
          // longestStreak remains unchanged (historical record)
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              icon: true,
              color: true,
              scope: true,
            },
          },
        },
      });

      // Create audit log for reactivation
      await tx.habitAudit.create({
        data: {
          habitId: id,
          userId,
          changeType: 'REACTIVATED',
          reason: reason || 'User reactivated habit',
        },
      });

      return reactivated;
    });
  },
};
