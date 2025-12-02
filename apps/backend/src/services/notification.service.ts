/**
 * Notification Service
 * Sprint 6 - US-051
 *
 * Service for managing notification configurations for habits.
 * Handles create/update/delete operations for NotificationSetting model.
 */

import { prisma } from '../lib/prisma.js';

export interface UpdateNotificationConfigData {
  enabled: boolean;
  time: string;
}

export const notificationService = {
  /**
   * Updates notification configuration for a habit
   * Creates, updates, or disables NotificationSetting based on enabled flag
   *
   * If enabled = true: Creates or updates NotificationSetting
   * If enabled = false: Sets enabled = false (soft disable)
   *
   * Idempotent: Multiple calls with same values don't cause errors
   */
  async updateNotificationConfig(
    habitId: string,
    userId: string,
    data: UpdateNotificationConfigData
  ) {
    // Check if notification setting already exists
    const existing = await prisma.notificationSetting.findUnique({
      where: { habitId },
    });

    if (data.enabled) {
      // Create or update notification setting
      if (existing) {
        // Update existing
        return prisma.notificationSetting.update({
          where: { habitId },
          data: {
            enabled: true,
            time: data.time,
          },
        });
      } else {
        // Create new
        return prisma.notificationSetting.create({
          data: {
            habitId,
            userId,
            enabled: true,
            time: data.time,
          },
        });
      }
    } else {
      // Disable notification
      if (existing) {
        // Soft disable (keep configuration but set enabled = false)
        return prisma.notificationSetting.update({
          where: { habitId },
          data: {
            enabled: false,
          },
        });
      } else {
        // No existing config and trying to disable - create disabled config
        return prisma.notificationSetting.create({
          data: {
            habitId,
            userId,
            enabled: false,
            time: data.time,
          },
        });
      }
    }
  },

  /**
   * Gets notification configuration for a habit
   * Returns null if no configuration exists
   */
  async getNotificationConfig(habitId: string) {
    return prisma.notificationSetting.findUnique({
      where: { habitId },
    });
  },

  /**
   * Deletes notification configuration for a habit
   * Hard delete - removes the record completely
   */
  async deleteNotificationConfig(habitId: string) {
    const existing = await prisma.notificationSetting.findUnique({
      where: { habitId },
    });

    if (existing) {
      return prisma.notificationSetting.delete({
        where: { habitId },
      });
    }

    return null;
  },
};
