/**
 * Habit Controller
 * Sprint 3 - US-021, Sprint 4 - US-029, Sprint 6 - US-048, US-049, US-051
 */

import { Request, Response, NextFunction } from 'express';
import { habitService } from '../services/habit.service.js';
import { habitRecordService } from '../services/habitRecord.service.js';
import { habitProgressService } from '../services/habitProgress.service.js';
import { statsService } from '../services/stats.service.js';
import { auditService } from '../services/audit.service.js';
import { notificationService } from '../services/notification.service.js';
import {
  createHabitSchema,
  updateHabitSchema,
  getHabitsQuerySchema,
  getAuditHistorySchema,
  reactivateHabitSchema,
} from '../validations/habit.validation.js';
import { updateNotificationConfigSchema } from '../validations/notification.validation.js';
import {
  createHabitRecordSchema,
  getRecordByDateSchema,
  getRecordsByDateRangeSchema,
  getHistoricalRecordsSchema,
  retroactiveMarkingSchema,
} from '../validations/habitRecord.validation.js';
import { updateProgressSchema } from '../validations/habitProgress.validation.js';
import { UnauthorizedError } from '../middlewares/error.middleware.js';

export const habitController = {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      const query = getHabitsQuerySchema.parse(req.query);

      const habits = await habitService.findAll(user.id, query.categoryId);

      res.status(200).json({ habits });
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      const { id } = req.params;
      const habit = await habitService.findById(id, user.id);

      res.status(200).json({ habit });
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      const validatedData = createHabitSchema.parse(req.body);

      const habit = await habitService.create(user.id, validatedData);

      res.status(201).json({ habit });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      const { id } = req.params;
      const validatedData = updateHabitSchema.parse(req.body);

      const habit = await habitService.update(id, user.id, validatedData);

      res.status(200).json({ habit });
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      const { id } = req.params;
      await habitService.delete(id, user.id);

      res.status(200).json({ message: 'Habit deleted successfully' });
    } catch (error) {
      next(error);
    }
  },

  // ==================== HabitRecord endpoints (Sprint 4 - US-029) ====================

  /**
   * POST /api/habits/:id/records
   * Creates or updates a habit record for a specific date
   */
  async createOrUpdateRecord(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      const { id: habitId } = req.params;
      const validatedData = createHabitRecordSchema.parse(req.body);

      const record = await habitRecordService.createOrUpdateRecord(user.id, {
        habitId,
        date: validatedData.date,
        completed: validatedData.completed,
        value: validatedData.value,
        notes: validatedData.notes,
      });

      res.status(200).json({ record });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/habits/:id/records/:date
   * Gets a habit record for a specific date
   */
  async getRecordByDate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      const { id: habitId, date: dateParam } = req.params;
      const { date } = getRecordByDateSchema.parse({ date: dateParam });

      const record = await habitRecordService.getRecordByDate(habitId, user.id, date);

      if (!record) {
        res.status(404).json({ record: null, message: 'No record found for this date' });
        return;
      }

      res.status(200).json({ record });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/habits/:id/records
   * Gets all habit records for a date range
   */
  async getRecordsByDateRange(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      const { id: habitId } = req.params;
      const { startDate, endDate } = getRecordsByDateRangeSchema.parse(req.query);

      const records = await habitRecordService.getRecordsByDateRange(
        habitId,
        user.id,
        startDate,
        endDate
      );

      res.status(200).json({ records });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PUT /api/habits/:id/daily/:date
   * Marks a habit for a specific date (retroactive marking)
   * Sprint 4 - US-030
   *
   * This endpoint is functionally identical to POST /api/habits/:id/records
   * but provides a more explicit RESTful route for date-specific marking.
   * Validates that date is within allowed range (today - 7 days to today)
   */
  async markHabitForSpecificDate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      const { id: habitId, date: dateParam } = req.params;

      // Parse body (completed, value, notes) and validate date from URL
      const validatedData = createHabitRecordSchema.parse({
        ...req.body,
        date: dateParam, // Use date from URL parameter
      });

      const record = await habitRecordService.createOrUpdateRecord(user.id, {
        habitId,
        date: validatedData.date,
        completed: validatedData.completed,
        value: validatedData.value,
        notes: validatedData.notes,
      });

      res.status(200).json({ record });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PUT /api/habits/:id/daily/:date/progress
   * Updates progress incrementally for NUMERIC habits
   * Sprint 4 - US-032
   *
   * Allows users to update habit value incrementally during the day.
   * Auto-completes habit when value reaches targetValue.
   */
  async updateProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      const { id: habitId, date: dateParam } = req.params;

      // Validate increment
      const { increment } = updateProgressSchema.parse(req.body);

      // Parse and validate date
      const { date } = getRecordByDateSchema.parse({ date: dateParam });

      // Update progress
      const result = await habitProgressService.updateHabitProgress(
        habitId,
        user.id,
        date,
        increment
      );

      res.status(200).json({
        record: result.record,
        progressPercentage: result.progressPercentage,
        autoCompleted: result.autoCompleted,
      });
    } catch (error) {
      next(error);
    }
  },

  // ==================== Stats endpoints (Sprint 5 - US-037, US-038) ====================

  /**
   * GET /api/habits/stats
   * Gets general statistics for the authenticated user
   * Includes today's completion, streaks, last 7 days, and category stats
   */
  async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      const stats = await statsService.getGeneralStats(user.id);

      res.status(200).json(stats);
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/habits/:id/stats
   * Gets detailed statistics for a specific habit
   * Sprint 5 - US-038
   *
   * Includes streaks, completion rates, last 30 days data, and numeric stats
   */
  async getHabitStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      const { id: habitId } = req.params;

      const stats = await statsService.getHabitStats(habitId, user.id);

      res.status(200).json(stats);
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/habits/:id/history
   * Gets historical records for a habit with filters and pagination
   * Sprint 5 - US-039
   *
   * Query params: from (default: 30 days ago), to (default: today), limit (max: 100), offset
   * Validations: YYYY-MM-DD format, from <= to, max 365 days range
   */
  async getHistoricalRecords(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      const { id: habitId } = req.params;
      const { from, to, limit, offset } = getHistoricalRecordsSchema.parse(req.query);

      const result = await habitRecordService.getHistoricalRecords(
        habitId,
        user.id,
        from,
        to,
        limit,
        offset
      );

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/habits/:id/records/retroactive
   * Marks a habit retroactively with full streak recalculation
   * Sprint 5 - US-040
   *
   * Body: { date: "YYYY-MM-DD", completed: boolean, value?: number, notes?: string }
   * Validations:
   * - Date must be within 7 days (today - 7 days <= date <= today)
   * - Date must not be in the future
   * - Habit must be scheduled for that date (periodicity check)
   * - Triggers full streak recalculation from that date to today
   *
   * Returns: { success, currentStreak, longestStreak, recordId }
   */
  async markRetroactively(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      const { id: habitId } = req.params;
      const validatedData = retroactiveMarkingSchema.parse(req.body);

      const result = await habitRecordService.markRetroactively(user.id, habitId, {
        habitId,
        date: validatedData.date,
        completed: validatedData.completed,
        value: validatedData.value,
        notes: validatedData.notes,
      });

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/habits/:id/audit
   * Gets audit history for a specific habit
   * Sprint 6 - US-048
   *
   * Query params: limit (default: 50, max: 100)
   * Returns: Array of audit logs ordered by createdAt DESC
   * Deserializes oldValue/newValue from JSON strings for readability
   */
  async getAuditHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      const { id: habitId } = req.params;
      const { limit } = getAuditHistorySchema.parse(req.query);

      // Verify habit exists and belongs to user
      await habitService.findById(habitId, user.id);

      // Get audit history
      const auditLogs = await auditService.getHabitAuditHistory(habitId, user.id, limit);

      // Deserialize oldValue/newValue for readability
      const formattedLogs = auditLogs.map((log) => ({
        id: log.id,
        changeType: log.changeType,
        fieldChanged: log.fieldChanged,
        oldValue: log.oldValue ? JSON.parse(log.oldValue) : null,
        newValue: log.newValue ? JSON.parse(log.newValue) : null,
        reason: log.reason,
        createdAt: log.createdAt,
      }));

      res.status(200).json({ auditLogs: formattedLogs, total: formattedLogs.length });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/habits/:id/reactivate
   * Reactivates a previously deleted habit
   * Sprint 6 - US-049
   *
   * Body (optional): { reason?: string }
   * Validates habit is inactive, sets isActive=true, resets currentStreak=0
   * Maintains longestStreak and creates audit log with REACTIVATED changeType
   */
  async reactivate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      const { id: habitId } = req.params;
      const validatedData = reactivateHabitSchema.parse(req.body);

      const habit = await habitService.reactivate(habitId, user.id, validatedData.reason);

      res.status(200).json({
        message: 'Habit reactivated successfully',
        habit,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PUT /api/habits/:id/notifications
   * Updates notification configuration for a habit
   * Sprint 6 - US-051
   *
   * Body: { enabled: boolean, time: string }
   * Validates time format (HH:mm), creates/updates/disables NotificationSetting
   * Idempotent: Multiple calls with same values don't cause errors
   */
  async updateNotificationConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      const { id: habitId } = req.params;
      const validatedData = updateNotificationConfigSchema.parse(req.body);

      // Verify habit exists and belongs to user
      await habitService.findById(habitId, user.id);

      const config = await notificationService.updateNotificationConfig(
        habitId,
        user.id,
        validatedData
      );

      res.status(200).json({
        message: 'Notification configuration updated successfully',
        notificationConfig: config,
      });
    } catch (error) {
      next(error);
    }
  },
};
