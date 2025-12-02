/**
 * Audit Service
 * Sprint 6 - US-047
 *
 * Service for creating audit logs to track all changes made to habits.
 * Implements automatic change tracking for CRUD operations.
 */

import { prisma } from '../lib/prisma.js';
import { ChangeType } from '../generated/prisma/client.js';

export interface AuditLogData {
  habitId: string;
  userId: string;
  changeType: ChangeType;
  fieldChanged?: string;
  oldValue?: unknown;
  newValue?: unknown;
  reason?: string;
}

export const auditService = {
  /**
   * Creates a single audit log entry
   * Serializes complex values (arrays, objects) as JSON strings
   */
  async createAuditLog(data: AuditLogData): Promise<void> {
    await prisma.habitAudit.create({
      data: {
        habitId: data.habitId,
        userId: data.userId,
        changeType: data.changeType,
        fieldChanged: data.fieldChanged || null,
        oldValue: data.oldValue !== undefined ? JSON.stringify(data.oldValue) : null,
        newValue: data.newValue !== undefined ? JSON.stringify(data.newValue) : null,
        reason: data.reason || null,
      },
    });
  },

  /**
   * Creates multiple audit log entries in a single transaction
   * Used when multiple fields are modified at once
   */
  async createMultipleAuditLogs(logs: AuditLogData[]): Promise<void> {
    await prisma.habitAudit.createMany({
      data: logs.map((log) => ({
        habitId: log.habitId,
        userId: log.userId,
        changeType: log.changeType,
        fieldChanged: log.fieldChanged || null,
        oldValue: log.oldValue !== undefined ? JSON.stringify(log.oldValue) : null,
        newValue: log.newValue !== undefined ? JSON.stringify(log.newValue) : null,
        reason: log.reason || null,
      })),
    });
  },

  /**
   * Logs habit creation
   * Creates a single audit entry with changeType = CREATED
   */
  async logHabitCreation(
    habitId: string,
    userId: string,
    habitData: Record<string, unknown>
  ): Promise<void> {
    await this.createAuditLog({
      habitId,
      userId,
      changeType: ChangeType.CREATED,
      newValue: habitData,
    });
  },

  /**
   * Logs habit deletion (soft delete)
   * Creates a single audit entry with changeType = DELETED
   */
  async logHabitDeletion(habitId: string, userId: string, reason?: string): Promise<void> {
    await this.createAuditLog({
      habitId,
      userId,
      changeType: ChangeType.DELETED,
      reason,
    });
  },

  /**
   * Logs habit reactivation (undo soft delete)
   * Creates a single audit entry with changeType = REACTIVATED
   */
  async logHabitReactivation(habitId: string, userId: string, reason?: string): Promise<void> {
    await this.createAuditLog({
      habitId,
      userId,
      changeType: ChangeType.REACTIVATED,
      reason,
    });
  },

  /**
   * Detects and logs changes between old and new habit data
   * Creates one audit entry per changed field
   *
   * Audited fields:
   * - name, description, periodicity, weekDays
   * - timeOfDay, color, targetValue, unit, categoryId
   */
  async logHabitUpdate(
    habitId: string,
    userId: string,
    oldData: Record<string, unknown>,
    newData: Record<string, unknown>
  ): Promise<void> {
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

    const logs: AuditLogData[] = [];

    for (const field of auditedFields) {
      const oldValue = oldData[field];
      const newValue = newData[field];

      // Skip if value didn't change
      if (JSON.stringify(oldValue) === JSON.stringify(newValue)) {
        continue;
      }

      logs.push({
        habitId,
        userId,
        changeType: ChangeType.UPDATED,
        fieldChanged: field,
        oldValue,
        newValue,
      });
    }

    if (logs.length > 0) {
      await this.createMultipleAuditLogs(logs);
    }
  },

  /**
   * Gets audit history for a specific habit
   * Returns entries ordered by createdAt DESC
   */
  async getHabitAuditHistory(habitId: string, userId: string, limit = 50) {
    return prisma.habitAudit.findMany({
      where: {
        habitId,
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  },
};
